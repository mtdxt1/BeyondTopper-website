// netlify/functions/list-records.js
// Returns all fee records from Airtable (for admin dashboard).
// Env: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME

exports.handler = async () => {
  const key    = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_NAME || 'FeeRecords';
  if (!key || !baseId) return json(200, { records: [] });

  const all = [];
  let offset = null;
  try {
    do {
      const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?pageSize=100${offset?`&offset=${offset}`:''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      const j = await res.json();
      if (j.records) all.push(...j.records.map(r => r.fields));
      offset = j.offset;
    } while (offset);
    return json(200, { records: all });
  } catch (e) {
    return json(500, { error: e.message, records: [] });
  }
};

function json(code, obj) {
  return { statusCode: code, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(obj) };
}
