# Synthetic rule-test fixtures

This directory is reserved for synthetic SaaS rule fixtures.

SaaS-01A does not define the final tenant contracts. Fixture data must be added
in SaaS-02 only after the SaaS-01B schemas and capability matrix are approved.

Rules:

- never copy production users, emails, conversations or academic records;
- use deterministic fake tenant and user IDs;
- include at least two tenants to test negative cross-tenant access;
- include every canonical membership and access state;
- keep fixtures independent from the Firebase project configured in
  `.firebaserc`.
