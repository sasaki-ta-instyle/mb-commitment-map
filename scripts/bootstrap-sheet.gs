/**
 * mb-commitment-map — スプシ初期化 Apps Script
 *
 * 使い方:
 *   1. 対象スプシ → 拡張機能 → Apps Script
 *   2. このファイル全体をコピペ
 *   3. 関数 `bootstrap` を選択 → 実行 (初回は権限承認)
 *   4. スプシに戻り、コミットメントリスト / マイルストーン / 凡例 / _members / _progress が
 *      揃っていれば OK
 *
 * 冪等: 既存タブがあれば skip、無ければ create。ヘッダー行は毎回上書きする。
 */

const HEADERS = {
  'コミットメントリスト': [
    'id', 'side', 'department', 'sub_department',
    'outcome', 'strategy', 'detail',
    'owner', 'due_date', 'progress',
    'editor', 'updated_at'
  ],
  '凡例': ['key', 'label', 'color_hex', 'display_order'],
  '戦略的フォーカス': ['サイド', 'フォーカスラベル', '目標サブ', '大目標'],
  '連携': ['連携①', '連携②', 'ラベル', 'スタイル'],
  '_members': ['name'],
  '_progress': ['label']
};

const GOALS_ROWS = [
  ['定量', '戦略的フォーカス：定量', '2027 年 3 月末までに', '利益 1 億円'],
  ['定性', '戦略的フォーカス：定性', '大切な人に',            '紹介したくなるブランド']
];

const LEGEND_ROWS = [
  ['モール', 'マーケ:モール', '#39D353', 1],
  ['本店',   'マーケ:本店',   '#F5D944', 2],
  ['CS',     'CS',            '#E5484D', 3],
  ['商品',   '商品',          '#7CE2FE', 4]
];

const PROGRESS_ROWS = [['未着手'], ['進行中'], ['完了'], ['停止']];

const MEMBERS_SEED = [
  ['高野'],
  ['小畠'],
  ['堀内'],
  ['近岡'],
  ['込谷'],
  ['阿部'],
  ['長谷川'],
  ['佐々木'],
  ['和田']
];

const SAMPLE_COMMITMENTS = [
  // id, side, dept, sub, outcome, strategy, detail, owner, due, progress, editor, updated
  ['C-001', '定量', 'モール',  'Amazon',  'モール売上 +30%',     'Amazon 検索順位を対策',  'ビッグワード 3 語で 3 位以内', '佐々木', '2026-09-30', '進行中', '佐々木', '2026-07-26'],
  ['C-002', '定量', '本店',    '新規定期', '新規定期 +40%',       'LP 転換率改善',           'ヒーロー AB テスト実施',     '佐々木', '2026-08-31', '未着手', '佐々木', '2026-07-26'],
  ['C-003', '定量', 'CS',      '解約率',   '解約率 5%→3%',         '解約フォーム導線見直し',   'BOTフロー 3 段階質問化',     '佐々木', '2026-10-31', '未着手', '佐々木', '2026-07-26'],
  ['C-004', '定量', '商品',    '企画+開発:SIMIUS', 'SIMIUS 新製品 3 本発売', '9 月同時発売キャンペーン', 'PR / LP / パッケージ準備', '佐々木', '2026-09-15', '進行中', '佐々木', '2026-07-26'],
  ['C-101', '定性', 'モール',  'Qoo10',    'クチコミ星 4.5 以上',   'レビュー返信ルール策定',   '48h 以内返信 SLA',           '佐々木', '2026-08-15', '未着手', '佐々木', '2026-07-26'],
  ['C-102', '定性', '本店',    'CRM',      '会員 NPS +10',          'ステップメール刷新',       'ようこそメール 7 通再設計',   '佐々木', '2026-09-30', '未着手', '佐々木', '2026-07-26'],
  ['C-103', '定性', 'CS',      '復活率',   '休眠復活 20%',           '離脱後 30 日フォロー',     '離脱アンケート導入',         '佐々木', '2026-11-30', '未着手', '佐々木', '2026-07-26'],
  ['C-104', '定性', '商品',    '管理:既存商品', '既存 SKU 品質向上',  'クレーム率 -50%',          '品質チェックリスト整備',     '佐々木', '2026-10-31', '未着手', '佐々木', '2026-07-26']
];

function bootstrap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. コミットメントリスト
  const commit = getOrCreateSheet(ss, 'コミットメントリスト');
  writeHeader(commit, HEADERS['コミットメントリスト']);
  if (commit.getLastRow() < 2) {
    commit.getRange(2, 1, SAMPLE_COMMITMENTS.length, SAMPLE_COMMITMENTS[0].length)
      .setValues(SAMPLE_COMMITMENTS);
  }
  commit.setFrozenRows(1);

  // 2. マイルストーン
  const ms = getOrCreateSheet(ss, 'マイルストーン');
  const msHeader = ['strategy_id', 'department', 'strategy_label', 'metric', 'unit'];
  for (let y = 2026; y <= 2027; y++) {
    const startM = y === 2026 ? 4 : 1;
    const endM   = y === 2026 ? 12 : 3;
    for (let m = startM; m <= endM; m++) {
      const yyyymm = `${y}-${String(m).padStart(2, '0')}`;
      msHeader.push(`${yyyymm}_target`);
      msHeader.push(`${yyyymm}_actual`);
    }
  }
  writeHeader(ms, msHeader);
  if (ms.getLastRow() < 2) {
    ms.getRange(2, 1, 4, 5).setValues([
      ['C-001', 'モール',  'Amazon 検索順位を対策',    '検索順位 3 位以内語数', '語'],
      ['C-002', '本店',    'LP 転換率改善',            'LP CVR',                 '%'],
      ['C-003', 'CS',      '解約フォーム導線見直し',   '月次解約率',             '%'],
      ['C-004', '商品',    '9 月同時発売キャンペーン', '発売本数',               '本']
    ]);
  }
  ms.setFrozenRows(1);
  ms.setFrozenColumns(5);

  // 3. 凡例
  const legend = getOrCreateSheet(ss, '凡例');
  writeHeader(legend, HEADERS['凡例']);
  if (legend.getLastRow() < 2) {
    legend.getRange(2, 1, LEGEND_ROWS.length, LEGEND_ROWS[0].length).setValues(LEGEND_ROWS);
  }

  // 3b. 戦略的フォーカス
  const goals = getOrCreateSheet(ss, '戦略的フォーカス');
  writeHeader(goals, HEADERS['戦略的フォーカス']);
  if (goals.getLastRow() < 2) {
    goals.getRange(2, 1, GOALS_ROWS.length, GOALS_ROWS[0].length).setValues(GOALS_ROWS);
  }
  goals.setFrozenRows(1);

  // 3c. 連携（部署をまたぐ関連。空でOK、必要になったら書き足す）
  const links = getOrCreateSheet(ss, '連携');
  writeHeader(links, HEADERS['連携']);
  links.setFrozenRows(1);

  // 4. _members
  const members = getOrCreateSheet(ss, '_members', true);
  writeHeader(members, HEADERS['_members']);
  if (members.getLastRow() < 2) {
    members.getRange(2, 1, MEMBERS_SEED.length, 1).setValues(MEMBERS_SEED);
  }

  // 5. _progress
  const progress = getOrCreateSheet(ss, '_progress', true);
  writeHeader(progress, HEADERS['_progress']);
  if (progress.getLastRow() < 2) {
    progress.getRange(2, 1, PROGRESS_ROWS.length, 1).setValues(PROGRESS_ROWS);
  }

  // 6. デフォルトの "シート1" を削除
  const default1 = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
  if (default1) ss.deleteSheet(default1);

  // 7. データ検証（プルダウン）を主タブに設定
  applyValidations(commit);

  SpreadsheetApp.getUi().alert('bootstrap 完了。コミットメントリスト・マイルストーン・凡例・戦略的フォーカス・連携・_members・_progress を初期化しました。');
}

function getOrCreateSheet(ss, name, hidden) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (hidden) sh.hideSheet();
  return sh;
}

function writeHeader(sh, headers) {
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
}

function applyValidations(commit) {
  const ss = commit.getParent();
  const membersRange  = ss.getSheetByName('_members').getRange('A2:A');
  const progressRange = ss.getSheetByName('_progress').getRange('A2:A');
  const departments = ['モール', '本店', 'CS', '商品'];
  const sides = ['定量', '定性'];

  // side (B)
  commit.getRange('B2:B').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(sides, true).build()
  );
  // department (C)
  commit.getRange('C2:C').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(departments, true).build()
  );
  // owner (H) / editor (K) → _members
  commit.getRange('H2:H').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(membersRange, true).build()
  );
  commit.getRange('K2:K').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(membersRange, true).build()
  );
  // progress (J) → _progress
  commit.getRange('J2:J').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(progressRange, true).build()
  );
}
