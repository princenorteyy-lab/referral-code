const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/app/applet/form_data.json', 'utf8'));
const fields = data[1][1];
fields.forEach(f => {
  if (f[1]) {
    console.log(f[1], f[4] ? f[4][0][1] : '', f[4] ? f[4][0][0] : '');
  }
});
