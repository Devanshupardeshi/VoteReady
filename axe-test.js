import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { spawn } from 'child_process';

async function run() {
  console.log('Connecting to existing Vite server on port 5174...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174');
  // Wait for splash screen to finish
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Running axe on Onboarding page...');
  const resultsOnboarding = await new AxePuppeteer(page).analyze();
  printViolations(resultsOnboarding.violations, 'Onboarding');

  // Navigate to main app
  // Step 1
  await page.click('button[aria-label^="First-time Voter"]');
  await page.click('button.btn-primary'); // Continue
  await new Promise(r => setTimeout(r, 500));
  
  // Step 2
  await page.select('select', 'Maharashtra');
  await page.click('button.btn-primary'); // Continue
  await new Promise(r => setTimeout(r, 500));
  
  // Step 3
  await page.click('button[aria-label^="Finding my booth"]');
  await page.click('button.btn-primary'); // Get Started
  await new Promise(r => setTimeout(r, 1000));

  console.log('Running axe on Main page (Timeline)...');
  const resultsTimeline = await new AxePuppeteer(page).analyze();
  printViolations(resultsTimeline.violations, 'Timeline');

  // Go to Chat
  await page.click('button[aria-controls="panel-chat"]');
  await new Promise(r => setTimeout(r, 500));
  const resultsChat = await new AxePuppeteer(page).analyze();
  printViolations(resultsChat.violations, 'Chat');

  // Go to Candidates
  await page.click('button[aria-controls="panel-candidates"]');
  await new Promise(r => setTimeout(r, 500));
  const resultsCandidates = await new AxePuppeteer(page).analyze();
  printViolations(resultsCandidates.violations, 'Candidates');

  // Go to Checklist
  await page.click('button[aria-controls="panel-checklist"]');
  await new Promise(r => setTimeout(r, 500));
  const resultsChecklist = await new AxePuppeteer(page).analyze();
  printViolations(resultsChecklist.violations, 'Checklist');

  await browser.close();
  console.log('Done!');
}

function printViolations(violations, context) {
  if (violations.length === 0) {
    console.log(`[${context}] No violations found!`);
    return;
  }
  console.log(`[${context}] Found ${violations.length} violations:`);
  violations.forEach(v => {
    console.log(` - ${v.id}: ${v.description}`);
    v.nodes.forEach(n => {
      console.log(`   Target: ${n.target}`);
      console.log(`   Failure: ${n.failureSummary}`);
    });
  });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
