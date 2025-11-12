# 数据库迁移说明

## 执行迁移

### 方法 1: 使用 Supabase Dashboard

1. 登录到你的 Supabase 项目
2. 进入 SQL Editor
3. 复制 `add_nutrition_details.sql` 文件的内容
4. 粘贴到 SQL Editor 中
5. 点击 Run 执行

### 方法 2: 使用 Supabase CLI

```bash
# 确保已安装 Supabase CLI
supabase db push

# 或者直接执行 SQL 文件
psql -h <your-host> -U postgres -d postgres -f migrations/add_nutrition_details.sql
```

## 迁移内容

此迁移为 `user_meals` 表添加了以下字段：

### 详细营养信息
- `fiber` - 膳食纤维 (g)
- `sugar` - 糖 (g)
- `sodium` - 钠 (mg)
- `calcium` - 钙 (mg)
- `vitamin_c` - 维生素C (mg)
- `iron` - 铁 (mg)
- `cholesterol` - 胆固醇 (mg)
- `saturated_fat` - 饱和脂肪 (g)
- `trans_fat` - 反式脂肪 (g)
- `potassium` - 钾 (mg)
- `vitamin_a` - 维生素A (μg)
- `vitamin_d` - 维生素D (μg)
- `vitamin_e` - 维生素E (mg)

### 其他字段
- `ingredients` - 识别的食材列表 (文本数组)
- `confidence` - AI识别置信度 (0-100)

## 注意事项

- 所有新字段都有默认值，不会影响现有数据
- 执行前请确保已备份数据
- 字段使用 `IF NOT EXISTS` 语句，可以安全地多次执行
