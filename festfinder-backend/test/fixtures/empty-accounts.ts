/** The accounts the empty test database has (fixtures/empty.ts) and e2e/empty.spec.ts (the /ops checks) signs in with. */
export const EMPTY_ACCOUNTS = {
  admin: { identifier: 'owner@feestfinder.test', password: 'empty-admin-1' },
  organizer: { identifier: 'hello@saigonsound.test', password: 'empty-organizer-1' },
  attendee: { identifier: 'lan@feestfinder.test', password: 'empty-attendee-1' },
};
