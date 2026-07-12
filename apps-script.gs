/**
 * Coorg Investments — Google Apps Script
 * ────────────────────────────────────────
 * Paste this entire script into:
 * Google Sheet → Extensions → Apps Script → Replace all code → Save
 *
 * Then: Triggers (clock icon) → Add Trigger:
 *   Function:    onFormSubmit
 *   Event type:  On form submit
 *
 * Also set GITHUB_TOKEN in Project Settings → Script Properties:
 *   Key:   GITHUB_TOKEN
 *   Value: (your GitHub personal access token — see README)
 */

// ── CONFIG — update these two values ────────────────────────────────────────
const GITHUB_OWNER = 'shabeebhaneef';       // your GitHub username
const GITHUB_REPO  = 'coorginvestments';    // your repo name
// ────────────────────────────────────────────────────────────────────────────

function onFormSubmit(e) {
  try {
    triggerGitHubAction();
    Logger.log('✅ GitHub Action triggered successfully');
  } catch (err) {
    Logger.log('❌ Error triggering GitHub Action: ' + err.message);
  }
}

function triggerGitHubAction() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');

  if (!token) {
    throw new Error('GITHUB_TOKEN not set in Script Properties. See setup instructions.');
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`;

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept':        'application/vnd.github+json',
      'Content-Type':  'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify({
      event_type: 'update-listings',
      client_payload: {
        triggered_by: 'google-form-submit',
        timestamp:    new Date().toISOString()
      }
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code     = response.getResponseCode();

  if (code !== 204) {
    throw new Error(`GitHub API returned ${code}: ${response.getContentText()}`);
  }
}

/**
 * Run this function manually once to test the trigger works
 * Apps Script → Run → testTrigger
 */
function testTrigger() {
  Logger.log('Testing GitHub Action trigger...');
  triggerGitHubAction();
  Logger.log('✅ Success! Check your GitHub Actions tab.');
}
