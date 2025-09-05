# Universal Node.js Testing Patterns Analysis

## Overview
This document analyzes comprehensive testing patterns for Node.js applications, covering different approaches for various types of services, controllers, and utilities. These patterns are framework-agnostic and can be applied to Express, NestJS, Fastify, or any Node.js application.

## Test File Analysis Summary

### 1. **Complex Service with External Dependencies**
- **Pattern**: Service with external APIs, databases, or message queues
- **Setup**: `beforeEach` with full module setup and comprehensive mocking
- **Mocking**: Type-safe interfaces with comprehensive mock objects
- **Testing**: Error scenarios, retry logic, external service interactions

### 2. **Service with Multiple Dependencies and Validation**
- **Pattern**: Service with multiple dependencies requiring validation
- **Setup**: `beforeEach` with mock configuration after module creation
- **Mocking**: Complex mock setup with return value configuration
- **Testing**: Authentication, batch operations, data validation

### 3. **Pure Utility Service**
- **Pattern**: Utility service with no external dependencies
- **Setup**: Simple `beforeEach` with minimal module setup
- **Mocking**: No mocks needed (pure functions)
- **Testing**: Mathematical calculations, edge cases, error conditions

## Detailed Pattern Analysis

### **Setup Patterns**

#### **Pattern 1: Complex Service Setup (External Dependencies)**
```typescript
beforeEach(async () => {
  // 1. Create type-safe mock interfaces
  mockExternalService = {
    method1: jest.fn(),
    method2: jest.fn(),
    connected: true,
  };

  mockDatabase = {
    query: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
  };

  // 2. Create TestingModule with all providers
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ServiceUnderTest,
      { provide: 'EXTERNAL_SERVICE', useValue: mockExternalService },
      { provide: 'DATABASE', useValue: mockDatabase },
    ],
  }).compile();

  // 3. Get service instance
  service = module.get<ServiceUnderTest>(ServiceUnderTest);
  
  // 4. Clear all mocks
  jest.clearAllMocks();
});
```

#### **Pattern 2: Simple Service Setup (Pure Functions)**
```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ServiceUnderTest],
  }).compile();

  service = module.get<ServiceUnderTest>(ServiceUnderTest);
});
```

#### **Pattern 3: Post-Setup Mock Configuration**
```typescript
beforeEach(async () => {
  // ... module setup ...
  
  service = module.get<ServiceUnderTest>(ServiceUnderTest);

  // Setup mock return values AFTER service creation
  mockExternalService.method1.mockResolvedValue(successResult);
  mockDatabase.query.mockReturnValue(mockQueryResult);
  
  jest.clearAllMocks();
});
```

### **Mocking Patterns**

#### **Pattern 1: Type-Safe Interface Mocks**
```typescript
interface MockExternalService {
  method1: jest.Mock;
  method2: jest.Mock;
  connected: boolean;
}

interface MockDatabase {
  query: jest.Mock;
  transaction: jest.Mock;
  close: jest.Mock;
}

// Usage
mockExternalService = {
  method1: jest.fn() as jest.Mock<Promise<boolean>>,
  method2: jest.fn() as jest.Mock<Promise<string>>,
  connected: true,
};
```

#### **Pattern 2: Complex Mock Objects with Nested Properties**
```typescript
mockMessageQueue = {
  channel: {
    publish: jest.fn(),
    consume: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
    checkQueue: jest.fn(),
  },
  connection: {
    close: jest.fn(),
    isConnected: true,
  },
};
```

#### **Pattern 3: Mock Return Value Configuration**
```typescript
// Simple return values
mockExternalService.method1.mockResolvedValue(true);

// Complex return values
mockAuthService.generateToken.mockReturnValue({
  token: 'test-token-hash',
  expiresAt: new Date().toISOString(),
  userId: 'user-123',
  permissions: ['read', 'write'],
});

// Chained return values
mockDatabase.query
  .mockResolvedValueOnce(mockResults[0])
  .mockResolvedValueOnce(mockResults[1])
  .mockResolvedValueOnce(null);
```

### **Testing Patterns**

#### **Pattern 1: Success Path Testing**
```typescript
it('should perform operation successfully', async () => {
  // Arrange
  const mockData = { /* test data */ };
  mockDependency.method.mockResolvedValue(expectedResult);

  // Act
  const result = await service.methodUnderTest(mockData);

  // Assert
  expect(result).toEqual(expectedResult);
  expect(mockDependency.method).toHaveBeenCalledWith(mockData);
  expect(mockDependency.method).toHaveBeenCalledTimes(1);
});
```

#### **Pattern 2: Error Handling Testing**
```typescript
it('should handle errors gracefully', async () => {
  // Arrange
  const error = new Error('Operation failed');
  mockDependency.method.mockRejectedValue(error);

  // Act & Assert
  await expect(service.methodUnderTest(mockData)).rejects.toThrow('Operation failed');
  expect(mockDependency.method).toHaveBeenCalled();
});
```

#### **Pattern 3: Validation Testing**
```typescript
it('should reject invalid data', async () => {
  // Arrange
  const invalidData = { /* invalid data */ };

  // Act & Assert
  await expect(service.methodUnderTest(invalidData)).rejects.toThrow('Validation failed');
  expect(mockDependency.method).not.toHaveBeenCalled();
});
```

#### **Pattern 4: Batch Operation Testing**
```typescript
it('should process batch successfully', async () => {
  // Arrange
  const batchData = [item1, item2, item3];
  mockDependency.method.mockResolvedValue(true);

  // Act
  await service.processBatch(batchData);

  // Assert
  expect(mockDependency.method).toHaveBeenCalledTimes(batchData.length);
  batchData.forEach((item, index) => {
    expect(mockDependency.method).toHaveBeenNthCalledWith(index + 1, item);
  });
});
```

#### **Pattern 5: Mathematical/Calculation Testing**
```typescript
it('should calculate exponential backoff correctly', () => {
  // Arrange
  const attempt = 2;
  const policy = {
    initialDelay: 1000,
    backoffMultiplier: 2,
    jitter: false,
  };

  // Act
  const delay = service.calculateDelay(attempt, policy);

  // Assert
  // 1000 * 2^2 = 4000ms
  expect(delay).toBe(4000);
});
```

#### **Pattern 6: Edge Case Testing**
```typescript
it('should handle edge cases', () => {
  // Test with boundary values
  const edgeCases = [
    { input: 0, expected: 1000 },
    { input: 10, expected: 10000 }, // Capped at max
    { input: -1, expected: 1000 }, // Invalid input
  ];

  edgeCases.forEach(({ input, expected }) => {
    const result = service.calculateDelay(input, policy);
    expect(result).toBe(expected);
  });
});
```

### **Assertion Patterns**

#### **Pattern 1: Method Call Verification**
```typescript
// Verify method was called
expect(mockDependency.method).toHaveBeenCalled();

// Verify method was called with specific arguments
expect(mockDependency.method).toHaveBeenCalledWith(expectedArgs);

// Verify method was called specific number of times
expect(mockDependency.method).toHaveBeenCalledTimes(2);

// Verify method was NOT called
expect(mockDependency.method).not.toHaveBeenCalled();
```

#### **Pattern 2: Complex Object Assertions**
```typescript
expect(mockMessageQueue.channel.publish).toHaveBeenCalledWith(
  'exchange.name',
  'routing.key',
  mockPayload,
  expect.objectContaining({
    headers: expect.objectContaining({
      'x-correlation-id': expect.any(String),
      'x-timestamp': expect.any(String),
      'x-service': 'service-name',
    } as Record<string, unknown>),
  } as Record<string, unknown>)
);
```

#### **Pattern 3: Type-Safe Assertions**
```typescript
// Type assertion for expect.any()
expect(result.data?.stats).toEqual({
  maxValue: 40,
  avgValue: 30,
  count: expect.any(Number) as number,
  metadata: {
    minValue: 10,
    maxValue: 50,
  },
});
```

#### **Pattern 4: Array and Iteration Assertions**
```typescript
// Verify each item in array
mockBatchPayloads.forEach((payload, index) => {
  expect(mockMessageQueue.channel.publish).toHaveBeenCalledWith(
    'exchange.name',
    'routing.key',
    payload,
    expect.objectContaining({
      headers: expect.objectContaining({
        'x-item-id': payload.itemId,
      } as Record<string, unknown>),
    } as Record<string, unknown>)
  );
});
```

### **Error Handling Patterns**

#### **Pattern 1: Transient Error Testing**
```typescript
it('should retry transient errors', () => {
  const transientErrors = [
    'connection timeout',
    'network failure',
    'temporary server error',
    'connection error',
  ];

  transientErrors.forEach(errorMessage => {
    const error = new Error(errorMessage);
    const result = service.shouldRetry(error, 1, { maxAttempts: 3 });
    expect(result).toBe(true);
  });
});
```

#### **Pattern 2: Non-Retryable Error Testing**
```typescript
it('should not retry validation errors', () => {
  const error = new Error('Invalid data format');
  const result = service.shouldRetry(error, 1, { maxAttempts: 3 });
  expect(result).toBe(false);
});
```

### **Mock Management Patterns**

#### **Pattern 1: Clear Mocks Between Tests**
```typescript
beforeEach(async () => {
  // ... setup ...
  jest.clearAllMocks();
});
```

#### **Pattern 2: Reset Mock Implementations**
```typescript
it('should handle different scenarios', () => {
  // First scenario
  mockDependency.method.mockResolvedValue(successResult);
  // ... test ...

  // Reset for second scenario
  mockDependency.method.mockRejectedValue(errorResult);
  // ... test ...
});
```

#### **Pattern 3: Mock Implementation Changes**
```typescript
it('should handle implementation changes', () => {
  // Mock to throw error
  mockDependency.method.mockImplementation(() => {
    throw new Error('Operation failed');
  });

  // Test error handling
  expect(() => service.methodUnderTest()).toThrow('Operation failed');
});
```

## Key Insights

### **1. Setup Complexity Varies by Service Type**
- **Simple services** (utilities): Minimal setup, no mocks
- **Complex services** (with dependencies): Full module setup with type-safe mocks
- **Services with post-setup config**: Mock configuration after service creation

### **2. Mocking Strategy Depends on Dependencies**
- **External APIs**: Type-safe interfaces with comprehensive mocking
- **Internal services**: Simple mock objects with return value configuration
- **Pure functions**: No mocking needed

### **3. Testing Approach Varies by Method Type**
- **Business logic**: Success/error path testing
- **Mathematical functions**: Edge case and calculation testing
- **Validation methods**: Invalid data testing
- **Batch operations**: Iteration and count verification

### **4. Assertion Patterns for Different Scenarios**
- **Simple returns**: Direct equality checks
- **Complex objects**: `expect.objectContaining()` with type assertions
- **Method calls**: `toHaveBeenCalled*()` family of matchers
- **Arrays**: Iteration with `forEach()` and individual assertions

### **5. Error Testing is Comprehensive**
- **Transient errors**: Retry logic testing
- **Validation errors**: Non-retryable error testing
- **Edge cases**: Boundary value testing
- **Implementation errors**: Mock implementation testing

## Recommendations for New Tests

### **1. Follow the Setup Pattern Based on Service Complexity**
- Use Pattern 1 for services with external dependencies
- Use Pattern 2 for simple utility services
- Use Pattern 3 for services requiring post-setup configuration

### **2. Use Type-Safe Mocking**
- Always define interfaces for complex mocks
- Use proper type assertions for `expect.any()`
- Leverage TypeScript for mock type safety

### **3. Test All Code Paths**
- Success paths with valid data
- Error paths with invalid data
- Edge cases with boundary values
- Batch operations with multiple items

### **4. Use Appropriate Assertion Patterns**
- Simple equality for basic returns
- `expect.objectContaining()` for complex objects
- `toHaveBeenCalled*()` for method verification
- Type assertions for `expect.any()` calls

### **5. Manage Mocks Properly**
- Clear mocks between tests
- Reset implementations when needed
- Use chained return values for sequential calls

## **Complex Mocking Patterns for External Libraries**

### **Pattern 7: Database Mocking (MongoDB)**
```typescript
// ❌ AVOID: require() style imports
const MongoClient = require('mongodb').MongoClient;

// ✅ USE: ES6 imports with proper mocking
import { MongoClient, ObjectId } from 'mongodb';

// Mock the entire module
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
  ObjectId: jest.fn(),
}));

// Setup in beforeEach
beforeEach(() => {
  const mockClient = {
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };

  (MongoClient as jest.Mock).mockImplementation(() => mockClient);
});
```

### **Pattern 8: ORM Model Mocking (Mongoose/TypeORM)**
```typescript
// ❌ AVOID: Complex generic type constraints
let model: jest.Mocked<Model<any>>;

// ✅ USE: Simplified mock with proper typing
interface MockModel {
  findById: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  countDocuments: jest.Mock;
  createIndexes: jest.Mock;
  collection: {
    stats: jest.Mock;
  };
}

let model: MockModel;

// Setup in beforeEach
beforeEach(() => {
  model = {
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    createIndexes: jest.fn(),
    collection: {
      stats: jest.fn(),
    },
  };
});
```

### **Pattern 9: Avoiding Unbound Method Issues**
```typescript
// ❌ AVOID: Unbound method references
expect(model.findById).toHaveBeenCalledWith('id');

// ✅ USE: toHaveBeenCalledTimes() for mock verification
expect(model.findById).toHaveBeenCalledTimes(1);

// ✅ OR: Use proper mock setup with return values
model.findById.mockReturnValue({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockData),
  }),
});
```

### **Pattern 10: Handling Implied Eval Issues**
```typescript
// ❌ AVOID: setTimeout with string functions
setTimeout('callback()', 100);

// ✅ USE: Arrow functions or proper function references
setTimeout(() => callback(), 100);

// ✅ OR: Use jest timers for testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

### **Pattern 11: Complex Mock Return Values**
```typescript
// ❌ AVOID: Unsafe any assignments
const result = mockMethod() as any;

// ✅ USE: Proper type assertions
const result = mockMethod() as unknown as ExpectedType;

// ✅ OR: Use mockReturnValue with proper typing
mockMethod.mockReturnValue({
  property: 'value',
  method: jest.fn(),
} as ExpectedType);
```

## **Updated Recommendations for Complex Test Files**

### **1. Use ES6 Imports for External Libraries**
- Always use `import` instead of `require()`
- Mock the entire module at the top level
- Use proper TypeScript interfaces for mock objects

### **2. Simplify Mock Objects**
- Avoid complex generic type constraints
- Use simple interfaces with jest.Mock properties
- Focus on the methods actually used in tests

### **3. Use toHaveBeenCalledTimes() for Verification**
- Avoid unbound method issues
- Focus on call count rather than specific arguments
- Use proper mock setup instead of complex assertions

### **4. Handle Async Operations Properly**
- Use arrow functions instead of string functions
- Leverage jest timers for timeout testing
- Use proper Promise mocking patterns

### **5. Type Safety in Mocks**
- Use `as unknown as Type` for complex type assertions
- Define proper interfaces for mock objects
- Avoid `any` types in favor of specific interfaces

## **Advanced Testing Patterns**

### **Pattern 12: Pure Function Testing**
```typescript
// ✅ Pattern: No mocks needed for pure functions
describe('Utility Functions', () => {
  it('should create error with all properties', () => {
    const error = new CustomError(
      'ERROR_CODE',
      'Error message',
      ErrorCategory.INTERNAL,
      ErrorSeverity.MEDIUM,
      mockContext
    );
    
    expect(error.code).toBe('ERROR_CODE');
    expect(error.message).toBe('Error message');
    expect(error.category).toBe(ErrorCategory.INTERNAL);
  });
});

// ✅ Pattern: Mathematical calculation testing
describe('calculateDelay', () => {
  it('should calculate exponential backoff correctly', () => {
    const delay = service.calculateDelay(2, policy);
    expect(delay).toBe(4000); // 1000 * 2^2
  });
});
```

### **Pattern 13: Controller Testing with Service Mocks**
```typescript
// ✅ Pattern: Type-safe service mocks
let service: {
  create: jest.Mock;
  findAll: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  getStats: jest.Mock;
  getClusters: jest.Mock;
  getTrends: jest.Mock;
  streamData: jest.Mock;
  getMetadata: jest.Mock;
  getStorageStats: jest.Mock;
};

// ✅ Pattern: Helper functions for type safety
const createMockDocument = <T>(data: T) => ({
  ...data,
  toObject: () => data,
  toJSON: () => data,
});

const anyNumber = () => expect.any(Number) as unknown as number;
const arrayContaining = <T>(items: T[]) => expect.arrayContaining(items) as unknown as T[];
```

### **Pattern 14: Consumer Testing with External Dependencies**
```typescript
// ✅ Pattern: Mock entire modules at top level
jest.mock('@shared/messaging', () => ({
  validateMessage: jest.fn(),
  generateIdempotencyKey: jest.fn(),
  normalizePayload: jest.fn(),
}));

// ✅ Pattern: Complex mock object creation
const MockDataModel = Object.assign(
  jest.fn().mockImplementation((doc: Record<string, unknown>) => {
    return {
      ...doc,
      save: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
    };
  }),
  {
    findOne: jest.fn(),
    create: jest.fn(),
  }
);

// ✅ Pattern: Message mocking
const createMockMessage = (messageId?: string, correlationId?: string) => ({
  properties: {
    messageId: messageId || 'test-message-id',
    headers: {
      'x-correlation-id': correlationId || 'test-correlation-id',
    },
  },
});
```

### **Pattern 15: Service Testing with Interface Injection**
```typescript
// ✅ Pattern: Interface-based mocking
let mockDataStore: jest.Mocked<IDataStore>;

beforeEach(async () => {
  mockDataStore = {
    store: jest.fn(),
    getUrl: jest.fn(),
    getMetadata: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    getFileSize: jest.fn(),
    getStats: jest.fn(),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [DataService, { provide: 'IDataStore', useValue: mockDataStore }],
  }).compile();
});
```

### **Pattern 16: Middleware Testing with Express Mocks**
```typescript
// ✅ Pattern: Type-safe Express mocks
interface MockRequest extends Partial<Request> {
  headers: Record<string, string>;
  correlationId?: string;
}

interface MockResponse extends Partial<Response> {
  setHeader: jest.Mock;
  locals: Record<string, unknown>;
}

interface MockNextFunction extends NextFunction {
  (): void;
}

// ✅ Pattern: Mock setup in beforeEach
beforeEach(async () => {
  mockRequest = { headers: {} };
  mockResponse = { setHeader: jest.fn(), locals: {} };
  mockNext = jest.fn();
});
```

### **Pattern 17: Interceptor Testing with Execution Context**
```typescript
// ✅ Pattern: Execution context mocking
interface MockExecutionContext {
  switchToHttp: () => {
    getRequest: () => { correlationId?: string };
  };
}

interface MockCallHandler {
  handle: jest.Mock;
}

// ✅ Pattern: Observable testing
mockCallHandler = {
  handle: jest.fn().mockReturnValue(of('test result')),
};
```

### **Pattern 18: Domain Service Testing with Repository Mocks**
```typescript
// ✅ Pattern: Complex repository mocking
let mockRepository: {
  create: jest.Mock;
  findById: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  findByField: jest.Mock;
  findByTimeRange: jest.Mock;
  findByBounds: jest.Mock;
};

let mockDataStore: {
  store: jest.Mock;
  get: jest.Mock;
  delete: jest.Mock;
  exists: jest.Mock;
};
```

### **Pattern 19: Validation Service Testing**
```typescript
// ✅ Pattern: Exception testing
it('should throw error for invalid input', () => {
  expect(() => service.validateInput(91, 0)).toThrow(BadRequestException);
  expect(() => service.validateInput(-91, 0)).toThrow(BadRequestException);
});

// ✅ Pattern: Edge case testing
it('should validate edge cases', () => {
  const now = Date.now();
  expect(service.validateTimestamp(now)).toBe(true);
  expect(service.validateTimestamp(0)).toBe(true); // Unix epoch
  expect(service.validateTimestamp(now - 86400000)).toBe(true); // 1 day ago
});
```

### **Pattern 20: Controller Testing with Response Formatting**
```typescript
// ✅ Pattern: Response structure testing
it('should return formatted response', async () => {
  const mockResult = { processed: 5, failed: 2 };
  mockService.processData.mockResolvedValue(mockResult);

  const result = await controller.processData();

  expect(result).toEqual({
    message: 'Data processing completed',
    processed: 5,
    failed: 2,
  });
});
```

This analysis provides a comprehensive guide for implementing tests that follow established patterns in Node.js applications, including solutions for complex mocking scenarios and patterns from various test files analyzed.