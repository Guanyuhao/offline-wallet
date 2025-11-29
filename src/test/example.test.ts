/**
 * 示例测试文件
 *
 * 这个文件展示了基本的测试结构。
 * 实际的测试用例应该在对应的 __tests__ 目录中。
 *
 * 测试文件命名规范：
 * - 组件测试: src/components/ComponentName/__tests__/ComponentName.test.ts
 * - Composable 测试: src/composables/__tests__/useComposableName.test.ts
 * - Store 测试: src/stores/__tests__/storeName.test.ts
 * - 工具函数测试: src/utils/__tests__/functionName.test.ts
 */

import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});
