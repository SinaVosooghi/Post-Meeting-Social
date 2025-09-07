# 🧪 **Playwright Test Commands - Individual File Testing**

## **Test Run Commands for Each File**

### **1. Basic Page Tests**
```bash
# Run entire basic-page-tests.spec.ts file
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium

# Run specific test by name
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium -g "Landing page loads correctly"
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium -g "Navigation works correctly"
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium -g "Demo page loads with correct elements"
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium -g "Home page content generation UI works"
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium -g "Mobile responsiveness works"
```

### **2. Auth Flow Tests**
```bash
# Run entire auth-flow-tests.spec.ts file
yarn test:e2e tests/e2e/auth-flow-tests.spec.ts --project=chromium

# Run specific test by name
yarn test:e2e tests/e2e/auth-flow-tests.spec.ts --project=chromium -g "Demo page shows LinkedIn connection"
yarn test:e2e tests/e2e/auth-flow-tests.spec.ts --project=chromium -g "Settings page shows OAuth configuration"
```

### **3. Content Generation Tests**
```bash
# Run entire content-generation-tests.spec.ts file
yarn test:e2e tests/e2e/content-generation-tests.spec.ts --project=chromium

# Run specific test by name
yarn test:e2e tests/e2e/content-generation-tests.spec.ts --project=chromium -g "Content generation UI responds correctly"
yarn test:e2e tests/e2e/content-generation-tests.spec.ts --project=chromium -g "Email generation UI responds correctly"
yarn test:e2e tests/e2e/content-generation-tests.spec.ts --project=chromium -g "Tab switching works correctly"
yarn test:e2e tests/e2e/content-generation-tests.spec.ts --project=chromium -g "Error handling works correctly"
yarn test:e2e tests/e2e/content-generation-tests.spec.ts --project=chromium -g "Loading states work correctly"
```

### **4. Demo Page Tests**
```bash
# Run entire demo-page-tests.spec.ts file
yarn test:e2e tests/e2e/demo-page-tests.spec.ts --project=chromium

# Run specific test by name
yarn test:e2e tests/e2e/demo-page-tests.spec.ts --project=chromium -g "Demo page workflow works end-to-end"
yarn test:e2e tests/e2e/demo-page-tests.spec.ts --project=chromium -g "LinkedIn connection flow works"
yarn test:e2e tests/e2e/demo-page-tests.spec.ts --project=chromium -g "Content generation on demo page works"
yarn test:e2e tests/e2e/demo-page-tests.spec.ts --project=chromium -g "Publishing workflow works"
```

### **5. Error Handling Tests**
```bash
# Run entire error-handling-tests.spec.ts file
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium

# Run specific test by name
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium -g "API error handling works correctly"
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium -g "Network error handling works"
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium -g "Invalid response handling works"
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium -g "Empty transcript handling works"
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium -g "LinkedIn connection error handling works"
yarn test:e2e tests/e2e/error-handling-tests.spec.ts --project=chromium -g "Publishing error handling works"
```

## **Quick Status Check Commands**

```bash
# Check which tests are currently passing
yarn test:e2e --project=chromium --reporter=list

# Run only passing tests
yarn test:e2e --project=chromium --grep-invert="failing|error"

# Run tests with specific timeout
yarn test:e2e --project=chromium --timeout=10000
```

## **Debug Commands**

```bash
# Run with debug mode
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium --debug

# Run with headed mode (see browser)
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium --headed

# Run with trace
yarn test:e2e tests/e2e/basic-page-tests.spec.ts --project=chromium --trace=on
```
