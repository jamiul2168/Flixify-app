// ════════════════════════════════════════════════════════════════════════════
//  FLIXIFY — Google Apps Script Backend  [CLEAN v2]
//
//  ✅ Notification সিস্টেম সম্পূর্ণ বাদ
//  ✅ Active Users tracking (ping, stats)
//  ✅ Settings (Force Update, Banner, Maintenance, URLs)
//  ✅ User management (list, delete, cleanup)
// ════════════════════════════════════════════════════════════════════════════

var SHEET_SETTINGS = 'Settings';
var SHEET_USERS    = 'Users';

// ─────────────────────────────────────────────────────────────────────────────
//  setupSheets — প্রথমবার deploy করার পর manually run করো
// ─────────────────────────────────────────────────────────────────────────────
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Settings Sheet ────────────────────────────────────────────────────────
  var sSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sSheet) {
    sSheet = ss.insertSheet(SHEET_SETTINGS);
    var defaults = [
      ['Key',                  'Value'],
      ['ticker_text',          '🎬 Flixify তে স্বাগতম! নতুন মুভি প্রতিদিন আসছে।'],
      ['telegram_url',         'https://t.me/flixifyofficialgrp'],
      ['request_url',          'https://request.flixify.jhtone.site/'],
      ['ad_url',               ''],
      ['movies_per_page',      '18'],
      ['splash_duration',      '2000'],
      ['maintenance_mode',     'false'],
      ['maintenance_message',  '🔧 আমরা কিছু কাজ করছি, একটু পরে আসুন।'],
      ['banner_enabled',       'false'],
      ['banner_title',         ''],
      ['banner_message',       ''],
      ['force_update_enabled', 'false'],
      ['latest_version',       '1.0.0'],
      ['apk_download_url',     ''],
      ['update_changelog',     ''],
      ['content_api_url',    'https://script.google.com/macros/s/AKfycbx-rB3PNtoZVc6pm3GXq4kAeQkzvOTDkhJkL-XIQSIauG02Pp8gVMTA73bwb4MGvuMytg/exec'],
      ['content_domain',     'new1.flixify.jhtone.site'],
    ];
    sSheet.getRange(1, 1, defaults.length, 2).setValues(defaults);
    sSheet.getRange(1, 1, 1, 2)
      .setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00e5ff');
    sSheet.setColumnWidth(1, 220);
    sSheet.setColumnWidth(2, 500);
    sSheet.setFrozenRows(1);
    Logger.log('✅ Settings sheet তৈরি হয়েছে');
  } else {
    Logger.log('⏩ Settings sheet আগেই আছে');
  }

  // ── Users Sheet ───────────────────────────────────────────────────────────
  var uSheet = ss.getSheetByName(SHEET_USERS);
  if (!uSheet) {
    uSheet = ss.insertSheet(SHEET_USERS);
    uSheet.appendRow(['deviceId', 'lastSeen', 'firstSeen', 'pingCount']);
    uSheet.getRange(1, 1, 1, 4)
      .setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00e5ff');
    uSheet.setColumnWidth(1, 240);
    uSheet.setColumnWidth(2, 180);
    uSheet.setColumnWidth(3, 180);
    uSheet.setFrozenRows(1);
    Logger.log('✅ Users sheet তৈরি হয়েছে');
  } else {
    Logger.log('⏩ Users sheet আগেই আছে');
  }

  Logger.log('🎉 Setup সম্পন্ন!');
}

// ─────────────────────────────────────────────────────────────────────────────
//  doGet — entry point
// ─────────────────────────────────────────────────────────────────────────────
function doGet(e) {
  var params   = e.parameter;
  var callback = params.callback || 'callback';
  var action   = params.action   || '';
  var result;

  try {
    switch (action) {
      case 'getSettings':   result = getSettings();                                    break;
      case 'updateSetting': result = updateSetting(params.key, params.value);          break;
      case 'getUsers':      result = getUsers();                                        break;
      case 'deleteUser':    result = deleteUser(params.deviceId);                      break;
      case 'cleanupUsers':  result = cleanupUsers();                                    break;
      case 'getStats':      result = getStats();                                        break;
      case 'liveCount':     result = liveCount();                                       break;
      case 'ping':          result = pingUser(params.deviceId);                        break;
      default:              result = { status: 'error', message: 'Unknown: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

// ════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════════════════════
function getSettings() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return { status: 'error', message: 'Settings sheet নেই। setupSheets() run করো।' };

  var data     = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 0; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    var val = String(data[i][1] !== undefined ? data[i][1] : '').trim();
    if (key && key !== 'Key') settings[key] = val;
  }
  return { status: 'ok', settings: settings };
}

function updateSetting(key, value) {
  if (!key) return { status: 'error', message: 'Key দাও' };
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return { status: 'error', message: 'Settings sheet নেই।' };

  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value || '');
      return { status: 'ok', key: key, value: value };
    }
  }
  // Key নেই — নতুন row যোগ করো
  sheet.appendRow([key, value || '']);
  return { status: 'ok', key: key, value: value };
}

// ════════════════════════════════════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════════════════════════════════════

// App খুললে এবং প্রতি ৫ মিনিটে app ping করে — এই function user track করে
function pingUser(deviceId) {
  if (!deviceId) return { status: 'error', message: 'deviceId দাও' };

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { status: 'error', message: 'Users sheet নেই। setupSheets() run করো।' };

  var now  = new Date();
  var data = sheet.getDataRange().getValues();

  // Existing user — lastSeen + pingCount update
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(deviceId)) {
      sheet.getRange(i + 1, 2).setValue(now);
      sheet.getRange(i + 1, 4).setValue((data[i][3] || 0) + 1);
      return { status: 'ok', type: 'update' };
    }
  }

  // New user
  sheet.appendRow([deviceId, now, now, 1]);
  return { status: 'ok', type: 'new' };
}

function getUsers() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet || sheet.getLastRow() < 2) return { status: 'ok', users: [] };

  var data  = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  var users = data
    .filter(function(row) { return row[0]; })
    .map(function(row) {
      return {
        deviceId:  String(row[0]),
        lastSeen:  row[1] ? new Date(row[1]).toISOString() : '',
        firstSeen: row[2] ? new Date(row[2]).toISOString() : '',
        pingCount: row[3] || 0,
      };
    });

  return { status: 'ok', users: users };
}

function deleteUser(deviceId) {
  if (!deviceId) return { status: 'error', message: 'deviceId দাও' };
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { status: 'error', message: 'Users sheet নেই' };

  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(deviceId)) {
      sheet.deleteRow(i + 1);
      return { status: 'ok', deleted: deviceId };
    }
  }
  return { status: 'error', message: 'User পাওয়া যায়নি' };
}

function cleanupUsers() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet || sheet.getLastRow() < 2) return { status: 'ok', deleted: 0 };

  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  var data    = sheet.getDataRange().getValues();
  var deleted = 0;

  for (var i = data.length - 1; i >= 1; i--) {
    var lastSeen = new Date(data[i][1]);
    if (!isNaN(lastSeen) && lastSeen < cutoff) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }
  return { status: 'ok', deleted: deleted };
}

// ════════════════════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════════════════════
function getStats() {
  var ss         = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = ss.getSheetByName(SHEET_USERS);

  var totalUsers  = 0;
  var onlineNow   = 0;
  var todayActive = 0;

  if (usersSheet && usersSheet.getLastRow() > 1) {
    var data       = usersSheet.getRange(2, 1, usersSheet.getLastRow() - 1, 2).getValues();
    var now        = Date.now();
    var FIVE_MIN   = 5 * 60 * 1000;
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    totalUsers = data.filter(function(r) { return r[0]; }).length;
    data.forEach(function(r) {
      var last = new Date(r[1]);
      if (!isNaN(last)) {
        if (now - last < FIVE_MIN)  onlineNow++;
        if (last >= todayStart)     todayActive++;
      }
    });
  }

  return {
    status:      'ok',
    totalUsers:  totalUsers,
    onlineNow:   onlineNow,
    todayActive: todayActive,
  };
}

function liveCount() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet || sheet.getLastRow() < 2) return { status: 'ok', count: 0 };

  var data     = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  var FIVE_MIN = 5 * 60 * 1000;
  var count    = 0;

  data.forEach(function(r) {
    var last = new Date(r[0]);
    if (!isNaN(last) && Date.now() - last < FIVE_MIN) count++;
  });

  return { status: 'ok', count: count };
}
