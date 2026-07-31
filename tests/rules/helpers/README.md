# Rules test helpers

`rulesTestEnvironment.mjs` creates an isolated Firebase Rules Unit Testing
environment for the demo-only project `demo-polish-learning`. It loads the
repository's provisional Firestore and Storage rules directly and never imports
the application's production-configured Firebase SDK instance.
