const assert = require('node:assert');
const { seed } = require('./src/db/seed');
const { db } = require('./src/db/database');
const { sendNotification } = require('./src/services/notificationService');

async function runNotificationTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE NOTIFICATION TEST SUITE (100 STUDENTS)');
  console.log('====================================================\n');

  // Step 0: Seed database with 100 students
  console.log('Step 0: Seeding 100 students in DB...');
  await seed();

  const students = db.prepare('SELECT id, reg_no, name, email FROM student_master ORDER BY id ASC').all();
  console.log(`Total students in student_master: ${students.length}`);
  assert.strictEqual(students.length, 100, `Expected 100 students, got ${students.length}`);

  // Helper to query notifications for a student email
  function getNotificationsForUser(email) {
    return db.prepare(`
      SELECT * FROM notification 
      WHERE recipient_user_id = ?
      ORDER BY created_at DESC
    `).all(email.trim().toLowerCase());
  }

  // Helper to query simulated emails for a student email
  function getEmailsForUser(email) {
    return db.prepare(`
      SELECT * FROM notification 
      WHERE recipient_user_id = ? AND (channel = 'both' OR channel = 'email-simulated')
      ORDER BY created_at DESC
    `).all(email.trim().toLowerCase());
  }

  // Clean all notifications to test cleanly
  db.exec('DELETE FROM notification;');
  console.log('Cleared notification table for clean isolated tests.\n');

  // ====================================================
  // TEST (a): Send to 1 student: that student sees 1, other 99 see 0
  // ====================================================
  console.log('--- TEST (a): Send to 1 student ---');
  const targetStudent1 = students[0]; // priya.sharma@college.edu
  
  const resA = sendNotification(
    { type: 'single', recipientId: targetStudent1.email },
    {
      eventType: 'round_result',
      eventKey: 'test_a_round_result_001',
      title: 'Interview Scheduled - Test A',
      message: 'Your Round 1 interview has been scheduled.',
      channel: 'both',
      senderId: 'Placement Cell <placements@campuslink.edu>'
    }
  );

  console.log(`Sent notification: ${JSON.stringify(resA)}`);
  assert.strictEqual(resA.recipientsCount, 1);
  assert.strictEqual(resA.insertedCount, 1);

  const student1Notifs = getNotificationsForUser(targetStudent1.email);
  assert.strictEqual(student1Notifs.length, 1, `Target student should see exactly 1 notification, got ${student1Notifs.length}`);

  let other99SawCount = 0;
  for (let i = 1; i < students.length; i++) {
    const notifs = getNotificationsForUser(students[i].email);
    if (notifs.length > 0) {
      other99SawCount += notifs.length;
    }
  }
  assert.strictEqual(other99SawCount, 0, `The other 99 students should see 0 notifications, got ${other99SawCount}`);
  console.log(`✅ TEST (a) PASSED: Target student sees 1 notification, all other 99 students see 0.\n`);

  // Clean table
  db.exec('DELETE FROM notification;');

  // ====================================================
  // TEST (b): Send to 10 selected students: each sees exactly 1, others see 0
  // ====================================================
  console.log('--- TEST (b): Send to 10 selected students ---');
  const selected10 = students.slice(10, 20);
  const selectedEmails = selected10.map(s => s.email);

  const resB = sendNotification(
    { type: 'list', studentEmails: selectedEmails },
    {
      eventType: 'round_result',
      eventKey: 'test_b_round_result_002',
      title: 'Shortlisted for Technical Assessment - Test B',
      message: 'Congratulations! You have been shortlisted for Round 2.',
      channel: 'both',
      senderId: 'Apex Innovations <careers@apexinnovations.com>'
    }
  );

  console.log(`Sent notification to 10 students: ${JSON.stringify(resB)}`);
  assert.strictEqual(resB.recipientsCount, 10);
  assert.strictEqual(resB.insertedCount, 10);

  // Verify each of the 10 selected sees exactly 1
  for (const s of selected10) {
    const notifs = getNotificationsForUser(s.email);
    assert.strictEqual(notifs.length, 1, `Student ${s.email} should see 1 notification, got ${notifs.length}`);
  }

  // Verify other 90 students see 0
  const other90 = students.filter(s => !selectedEmails.includes(s.email));
  assert.strictEqual(other90.length, 90);
  let other90Count = 0;
  for (const s of other90) {
    const notifs = getNotificationsForUser(s.email);
    other90Count += notifs.length;
  }
  assert.strictEqual(other90Count, 0, `The other 90 students should see 0 notifications, got ${other90Count}`);
  console.log(`✅ TEST (b) PASSED: Each of 10 selected students sees exactly 1 notification, other 90 see 0.\n`);

  // Clean table
  db.exec('DELETE FROM notification;');

  // ====================================================
  // TEST (c): Broadcast to all 100 students: each sees exactly 1
  // ====================================================
  console.log('--- TEST (c): Broadcast to all 100 students ---');
  const resC = sendNotification(
    { type: 'all' },
    {
      eventType: 'broadcast',
      eventKey: 'test_c_campus_drive_broadcast_003',
      title: 'Placement Drive Notice 2026 - Test C',
      message: 'All students are requested to update their resumes before Friday 5 PM.',
      channel: 'both',
      senderId: 'Placement Cell <placements@campuslink.edu>'
    }
  );

  console.log(`Broadcast result: ${JSON.stringify(resC)}`);
  assert.strictEqual(resC.recipientsCount, 100);
  assert.strictEqual(resC.insertedCount, 100);

  // Verify each student sees exactly 1 notification
  for (const s of students) {
    const notifs = getNotificationsForUser(s.email);
    assert.strictEqual(notifs.length, 1, `Student ${s.email} should see 1 notification, got ${notifs.length}`);
  }
  console.log(`✅ TEST (c) PASSED: All 100 students see exactly 1 notification each.\n`);

  // ====================================================
  // TEST (d): Send the same call twice (Idempotency Check)
  // ====================================================
  console.log('--- TEST (d): Idempotency test (call sendNotification twice with same eventKey) ---');
  const duplicatePayload = {
    eventType: 'broadcast',
    eventKey: 'test_c_campus_drive_broadcast_003', // SAME event key
    title: 'Placement Drive Notice 2026 - Test C Duplicate',
    message: 'All students are requested to update their resumes before Friday 5 PM.',
    channel: 'both',
    senderId: 'Placement Cell <placements@campuslink.edu>'
  };

  const resD = sendNotification({ type: 'all' }, duplicatePayload);
  console.log(`Duplicate call result: ${JSON.stringify(resD)}`);
  assert.strictEqual(resD.recipientsCount, 100);
  assert.strictEqual(resD.insertedCount, 0, `Expected 0 newly inserted rows due to idempotency, got ${resD.insertedCount}`);

  // Total rows in DB should still be exactly 100
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM notification').get().count;
  assert.strictEqual(totalCount, 100, `Total notifications should remain 100, got ${totalCount}`);

  // Each student still sees exactly 1
  for (const s of students) {
    const notifs = getNotificationsForUser(s.email);
    assert.strictEqual(notifs.length, 1, `Student ${s.email} should still see only 1 notification, got ${notifs.length}`);
  }
  console.log(`✅ TEST (d) PASSED: Retrying / duplicate send inserts 0 duplicates, each student still sees exactly 1.\n`);

  // ====================================================
  // TEST (e): Simulated email outbox shows one email per recipient
  // ====================================================
  console.log('--- TEST (e): Email outbox verification ---');
  for (const s of students) {
    const emails = getEmailsForUser(s.email);
    assert.strictEqual(emails.length, 1, `Student ${s.email} should see 1 email in outbox, got ${emails.length}`);
    assert.strictEqual(emails[0].recipient_user_id, s.email.toLowerCase());
  }

  // Check Placement Cell (all outbox)
  const allEmails = db.prepare(`
    SELECT * FROM notification 
    WHERE channel = 'both' OR channel = 'email-simulated'
  `).all();
  assert.strictEqual(allEmails.length, 100, `Admin outbox should show 100 total emails, got ${allEmails.length}`);
  console.log(`✅ TEST (e) PASSED: Simulated email outbox contains exactly one email per recipient.\n`);

  console.log('====================================================');
  console.log('🎉 ALL 5 TEST SCENARIOS PASSED WITH ZERO ERRORS!');
  console.log('====================================================');
}

runNotificationTestSuite().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
