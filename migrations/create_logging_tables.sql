-- 创建API日志表
CREATE TABLE IF NOT EXISTS api_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_type VARCHAR(20) CHECK (user_type IN ('anonymous', 'user', 'premium', 'admin')),
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL, -- 毫秒
  request_size INTEGER DEFAULT 0, -- 字节
  response_size INTEGER DEFAULT 0, -- 字节
  error_message TEXT,
  endpoint TEXT NOT NULL,
  api_version VARCHAR(10) DEFAULT 'v1',
  referer TEXT,
  country VARCHAR(2), -- ISO 3166-1 alpha-2
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建安全事件日志表
CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  details JSONB NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为api_logs表创建索引
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_ip_address ON api_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_type ON api_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_api_logs_response_time ON api_logs(response_time);

-- 为security_logs表创建索引
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_details ON security_logs USING GIN(details);

-- 启用RLS (行级安全)
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 只有管理员可以查看所有日志
CREATE POLICY "Admins can view all api_logs" ON api_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can view all security_logs" ON security_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- 用户只能查看自己的API日志
CREATE POLICY "Users can view own api_logs" ON api_logs
  FOR SELECT USING (user_id = auth.uid());

-- 用户只能查看自己的安全事件日志
CREATE POLICY "Users can view own security_logs" ON security_logs
  FOR SELECT USING (user_id = auth.uid());

-- 创建API日志统计视图
CREATE OR REPLACE VIEW api_logs_summary AS
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  endpoint,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_requests,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
  ROUND(AVG(response_time), 2) as avg_response_time,
  ROUND(MAX(response_time), 2) as max_response_time,
  ROUND(MIN(response_time), 2) as min_response_time,
  ROUND(AVG(request_size), 2) as avg_request_size,
  ROUND(AVG(response_size), 2) as avg_response_size
FROM api_logs
GROUP BY DATE_TRUNC('hour', timestamp), endpoint
ORDER BY hour DESC, endpoint;

-- 创建安全事件统计视图
CREATE OR REPLACE VIEW security_logs_summary AS
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_id) as unique_users
FROM security_logs
GROUP BY DATE_TRUNC('hour', timestamp), event_type, severity
ORDER BY hour DESC, event_count DESC;

-- 创建清理过期日志的函数
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS VOID AS $$
BEGIN
  -- 清理旧的API日志
  DELETE FROM api_logs
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;

  -- 清理旧的安全事件日志
  DELETE FROM security_logs
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;

  RAISE NOTICE '已清理 % 天前的日志记录', days_to_keep;
END;
$$ LANGUAGE plpgsql;

-- 创建定期清理任务（需要pg_cron扩展）
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs(90);');

-- 创建日志统计函数
CREATE OR REPLACE FUNCTION get_api_stats(
  start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
  end_time TIMESTAMPTZ DEFAULT NOW(),
  user_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  error_requests BIGINT,
  success_rate DECIMAL(5,2),
  avg_response_time DECIMAL(10,2),
  unique_endpoints BIGINT,
  unique_users BIGINT,
  top_endpoints JSON,
  error_breakdown JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
    ROUND(
      (COUNT(CASE WHEN status_code < 400 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as success_rate,
    ROUND(AVG(response_time), 2) as avg_response_time,
    COUNT(DISTINCT endpoint) as unique_endpoints,
    COUNT(DISTINCT user_id) as unique_users,
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'endpoint', endpoint,
          'count', req_count,
          'avg_response_time', ROUND(avg_rt, 2)
        )
      )
      FROM (
        SELECT
          endpoint,
          COUNT(*) as req_count,
          AVG(response_time) as avg_rt
        FROM api_logs al2
        WHERE al2.timestamp BETWEEN start_time AND end_time
        AND (user_id_param IS NULL OR al2.user_id = user_id_param)
        GROUP BY endpoint
        ORDER BY req_count DESC
        LIMIT 10
      ) top_eps
    ) as top_endpoints,
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'status_code', status_code,
          'count', status_count
        )
      )
      FROM (
        SELECT
          status_code,
          COUNT(*) as status_count
        FROM api_logs al3
        WHERE al3.timestamp BETWEEN start_time AND end_time
        AND (user_id_param IS NULL OR al3.user_id = user_id_param)
        AND status_code >= 400
        GROUP BY status_code
        ORDER BY status_count DESC
      ) error_stats
    ) as error_breakdown
  FROM api_logs al
  WHERE al.timestamp BETWEEN start_time AND end_time
  AND (user_id_param IS NULL OR al.user_id = user_id_param);
END;
$$ LANGUAGE plpgsql;

-- 创建插入日志的函数（带性能优化）
CREATE OR REPLACE FUNCTION insert_api_logs_batch(logs JSONB)
RETURNS VOID AS $$
DECLARE
  log_record JSONB;
BEGIN
  -- 使用JSONB批量插入提高性能
  INSERT INTO api_logs (
    id, timestamp, method, url, ip_address, user_agent, user_id, user_type,
    status_code, response_time, request_size, response_size, error_message,
    endpoint, api_version, referer, country, city
  )
  SELECT
    log->>'id',
    (log->>'timestamp')::TIMESTAMPTZ,
    log->>'method',
    log->>'url',
    log->>'ip_address'::INET,
    log->>'user_agent',
    (log->>'user_id')::UUID,
    log->>'user_type',
    (log->>'status_code')::INTEGER,
    (log->>'response_time')::INTEGER,
    (log->>'request_size')::INTEGER,
    (log->>'response_size')::INTEGER,
    log->>'error_message',
    log->>'endpoint',
    log->>'api_version',
    log->>'referer',
    log->>'country',
    log->>'city'
  FROM jsonb_array_elements(logs) AS log_record
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '批量插入了 % 条API日志记录', jsonb_array_length(logs);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE api_logs IS 'API调用日志记录表，用于性能监控和安全审计';
COMMENT ON TABLE security_logs IS '安全事件日志记录表，用于安全监控和威胁检测';
COMMENT ON FUNCTION cleanup_old_logs IS '清理过期日志记录的函数';
COMMENT ON FUNCTION get_api_stats IS '获取API统计信息的函数';
COMMENT ON FUNCTION insert_api_logs_batch IS '批量插入API日志的函数，提高插入性能';