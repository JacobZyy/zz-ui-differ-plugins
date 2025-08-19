# 用户偏好设置

- 用户偏好使用 TypeScript 编写脚本，并使用 tsx 包执行。dev 和 build 脚本都需要这样的配置。
- 用户强调：1. 不要过度发挥功能，严格按需求实现 2. 没有initialNeighborInfos就直接忽略，不需要降级逻辑 3. 不需要threshold逻辑，直接返回计算值 4. 不要用let，保持immutable 5. 不需要hasChanges逻辑 6. 不需要existingPadding检查逻辑 7. 禁止生成总结性文档、测试脚本、编译运行等额外内容
