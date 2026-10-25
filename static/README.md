# 教务管理后台（静态页面）

基于 Bootstrap 5.3.3 的经典后台界面，风格参考若依（RuoYi）。
所有静态资源均在 `org/static/` 下，后端通过 `/static` 挂载，同源访问，无需跨域配置。

## 目录

```
static/
├─ vendor/bootstrap/    # 本地 Bootstrap 5.3.3（CSS / JS）
├─ css/
│  ├─ common.css        # 若依经典主题、布局、表格、表单、弹窗
│  ├─ dashboard.css     # 概览页
│  ├─ login.css         # 登录页
│  ├─ schedule.css      # 课表页
│  ├─ checkin.css       # 学生报到页
│  ├─ score.css         # 成绩管理页
│  ├─ student.css       # 学生科目弹窗
│  ├─ announcement.css  # 公告管理页
│  ├─ about.css         # 系统信息页
│  └─ user.css          # 用户管理页
├─ js/
│  ├─ common.js         # 请求封装、分页、确认框、Toast、格式化
│  ├─ auth.js           # 前端登录守卫
│  ├─ login.js          # 登录页逻辑
│  ├─ layout.js         # 主框架菜单与 iframe
│  ├─ dashboard.js
│  ├─ student.js
│  ├─ checkin.js
│  ├─ teacher.js
│  ├─ classes.js
│  ├─ schedule.js
│  ├─ score.js
│  ├─ subject.js
│  ├─ announcement.js
│  └─ user.js
└─ html/
   ├─ index.html        # 主框架（侧边栏 + 顶栏 + iframe）
   ├─ login/index.html  # 登录页
   ├─ dashboard/index.html
   ├─ student/index.html
   ├─ checkin/index.html
   ├─ teacher/index.html
   ├─ classes/index.html
   ├─ schedule/index.html
   ├─ score/index.html
   ├─ subject/index.html
   ├─ announcement/index.html
   ├─ about/index.html
   └─ user/index.html
```

## 菜单结构

- 概览
- 学生管理：学生信息、学生报到
- 教务管理：教师管理、班级管理、课程管理、课表管理、成绩管理
- 系统管理：用户管理、公告管理、系统信息

## 启动

在 `org/fyz` 目录运行：

```bat
uvicorn main:app --host 127.0.0.1 --port 8002
```

启动后访问：

- 后台首页：<http://127.0.0.1:8002/>（自动跳转到 `/static/html/index.html`）
- 接口文档：<http://127.0.0.1:8002/docs>

如果服务原本已在运行，需要重启进程以加载 `main.py` 的静态挂载与首页重定向。

## 登录与注册

- 登录入口：`http://127.0.0.1:<端口>/login`（未登录访问后台页面也会跳转到登录页）。
- 默认管理员：`admin` / 密码：`123456`，密码以 PBKDF2 哈希存储在 `users` 表。
- 注册入口：登录卡片下方的“注册账号”。注册会写入 `users` 表，默认角色为教师，注册后可直接登录；注册账号可在“系统管理 → 用户管理”中维护。
- 勾选“记住登录”时使用 `localStorage`，否则使用 `sessionStorage`；右上角用户菜单可以退出登录。
- 登录已校验数据库用户，但业务 API 目前仍未接入令牌/会话鉴权，页面守卫也只在前端；如需接口级权限控制，应继续增加 token 与中间件。
- 原先浏览器 `localStorage` 中的演示账号不再使用。

## 用户表

用户管理使用 `users` 表。首次使用前，请手动执行：

```sql
source org/sql/users.sql
```

- 默认内置管理员 `admin / 123456`，角色为管理员，不能删除或停用。
- 密码使用 PBKDF2-SHA256 哈希存储，接口不返回密码字段。
- 用户管理支持查询、分页、新增、编辑、重置密码、启用/停用、删除。
- 角色分为管理员、教师；注册账号默认教师。

## 班级表

班级管理使用独立的 `classes` 表。首次使用前，请手动在 `school_db_study` 库中执行建表脚本：

```sql
source org/sql/classes.sql
```

或在数据库客户端中打开 `org/sql/classes.sql` 执行。

表字段：`id`（自增主键）、`name`（班级名称）、`code`（班级编号，唯一）、`address`（班级地址）、`create_time`（插入时自动取当前时间）。

现有 `students` / `teachers` 的 `class_id` 仍为普通整型字段，脚本未添加外键约束。

## 课表表

班级课表使用 `class_schedules` 表。首次使用前，请手动执行：

```sql
source org/sql/class_schedules.sql
```

- 星期 `weekday`：1-7（星期一至星期日）。
- 节次 `period`：1-8。
- `(class_id, weekday, period)` 唯一：同一班级同一时间只能有一节课。
- 同一教师同一时间不能跨班级重复排课（后端会校验）。
- 删除班级会级联删除该班课表；教师或课程仍被课表引用时不能删除。

## 公告表

公告管理使用 `announcements` 表。首次使用前，请手动执行：

```sql
source org/sql/announcements.sql
```

- `status = 1` 表示已发布，`status = 0` 表示草稿。
- 列表按发布时间倒序排列。
- 脚本会附带两条示例公告（欢迎公告、开学安排）。

## 报到表

学生报到使用 `student_checkins` 表。首次使用前，请手动执行：

```sql
source org/sql/student_checkins.sql
```

- 每个学生最多一条报到记录；没有记录表示“未报到”。
- 重复报到会更新报到时间和备注，不会产生重复行。
- 删除学生时，其报到记录自动删除。

## 学生学习科目

- 学生管理页每行提供“科目”按钮，打开学习科目弹窗。
- 弹窗展示两类科目：
  - 班级课表科目：从 `class_schedules` 推导，只读；
  - 手动添加科目：保存在 `student_subjects` 表。
- 新增科目只能从 `subjects` 表已有科目中选择；已在班级课表中或已添加的科目不能重复添加。
- 建表脚本：`org/sql/student_subjects.sql`。
- 手动添加的科目也会出现在“成绩管理”中，可以直接打分。

## 成绩管理

- 成绩录入区域默认分页展示全部学生；输入条件后按条件查询。**学号精准匹配**（学生 ID 完全相等），姓名模糊匹配；同时填写时按 AND 组合。当前学生表没有独立学号字段，暂用**学生 ID** 作为学号。
- 学生科目来自班级课表（`class_schedules`）、已有成绩的科目，以及学生手动添加的科目（`student_subjects`）。
- 成绩保存到现有 `score` 表；同一学生同一科目更新最新记录，不新增重复行；成绩范围 0-150。
- 成绩查询支持按学号（精准匹配）、姓名（模糊匹配）、班级、科目、最低分、最高分筛选，查询结果统一按**成绩从高到低**排列。

## 页面与接口

| 模块 | 使用的现有接口 | 支持操作 |
|---|---|---|
| 概览 | `/stu/page`、`/tea/all`、`/sub/all` | 统计、年级/班级分布、课程概况、最近学生 |
| 学生管理 | `/stu/page`、`/stu/one/{id}`、`/stu/add`、`/stu/update`、`/stu/del/{id}`、`/stu/subjects/{id}`、`/stu/subjects/add` | 查询、分页、新增、编辑（姓名/年龄/年级）、删除（同时清理成绩、报到记录、补充科目）、详情（含成绩）、查看/补充学习科目 |
| 学生报到 | `/chk/list`、`/chk/stats`、`/chk/checkin`、`/chk/undo`、`/chk/checkin-all` | 按班级/状态筛选、单个报到/撤销、按班级批量报到、报到率统计 |
| 教师管理 | `/tea/all`、`/tea/one/{id}`、`/tea/refs/{id}`、`/tea/del/{id}` | 查询、详情（含所带学生）、删除（自动删除排课；有学生时选择接替教师） |
| 班级管理 | `/cls/page`、`/cls/add`、`/cls/update`、`/cls/del/{id}` | 查询、分页、新增、编辑、删除、跳转课表 |
| 课表管理 | `/sch/list?class_id=`、`/sch/add`、`/sch/update`、`/sch/del/{id}` | 按班级查看周课表，点击格子添加/编辑/删除课程 |
| 成绩管理 | `/sco/students`、`/sco/subjects`、`/sco/save`、`/sco/list` | 按学号（学生 ID）/姓名查学生，录入/修改成绩；成绩查询支持班级/科目/分数区间筛选并按成绩降序 |
| 课程管理 | `/sub/all`、`/sub/add`、`/sub/update`、`/sub/del/{id}` | 查询、新增、编辑（名称/学分）、删除 |
| 用户管理 | `/usr/list`、`/usr/one/{id}`、`/usr/add`、`/usr/update`、`/usr/password`、`/usr/status`、`/usr/del/{id}` | 用户查询、分页、新增、编辑、重置密码、启用/停用、删除 |
| 登录注册 | `/auth/login`、`/auth/register` | 登录校验数据库用户；注册写入用户表 |
| 公告管理 | `/ann/list`、`/ann/one/{id}`、`/ann/add`、`/ann/update`、`/ann/del/{id}` | 公告查询、分页、新增、编辑、查看、删除；概览页展示最新公告 |
| 系统信息 | 静态页面 | 展示系统概况、技术栈、功能模块、数据与备份说明 |

说明：

- 现有教师新增/修改接口仍按旧字段 `subject` 写入，而数据库列是 `subject_id`，因此教师页暂不提供新增与编辑。
- 学生编辑接口仅接收姓名、年龄、年级，其他字段在弹窗中以只读方式展示。
- 课程编辑接口仅接收名称、学分，类型以只读方式展示。
- 删除操作受数据库外键约束，有关联成绩或学生时会给出提示。
