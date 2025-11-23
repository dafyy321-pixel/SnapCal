-- 扩展 user_meals 表，添加详细营养信息字段
-- 执行此SQL前请确保已备份数据

-- 添加详细营养信息字段
ALTER TABLE user_meals 
ADD COLUMN IF NOT EXISTS fiber NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugar NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sodium NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS calcium NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_c NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS iron NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cholesterol NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS saturated_fat NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trans_fat NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS potassium NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_a NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_d NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_e NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN user_meals.fiber IS '膳食纤维(g)';
COMMENT ON COLUMN user_meals.sugar IS '糖(g)';
COMMENT ON COLUMN user_meals.sodium IS '钠(mg)';
COMMENT ON COLUMN user_meals.calcium IS '钙(mg)';
COMMENT ON COLUMN user_meals.vitamin_c IS '维生素C(mg)';
COMMENT ON COLUMN user_meals.iron IS '铁(mg)';
COMMENT ON COLUMN user_meals.cholesterol IS '胆固醇(mg)';
COMMENT ON COLUMN user_meals.saturated_fat IS '饱和脂肪(g)';
COMMENT ON COLUMN user_meals.trans_fat IS '反式脂肪(g)';
COMMENT ON COLUMN user_meals.potassium IS '钾(mg)';
COMMENT ON COLUMN user_meals.vitamin_a IS '维生素A(μg)';
COMMENT ON COLUMN user_meals.vitamin_d IS '维生素D(μg)';
COMMENT ON COLUMN user_meals.vitamin_e IS '维生素E(mg)';
COMMENT ON COLUMN user_meals.ingredients IS '识别的食材列表';
COMMENT ON COLUMN user_meals.confidence IS 'AI识别置信度(0-100)';
