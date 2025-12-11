/**
 * Global test setup for component tests
 * Sets up Happy DOM environment once for all tests
 */

import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Set up DOM environment for component tests
GlobalRegistrator.register();