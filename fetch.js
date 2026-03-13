fetch('https://docs.google.com/forms/d/e/1FAIpQLScVDN0Ihav8KlNvRCHkXcjuJQl8dCbR_H88dHoZm410KMk-Bw/viewform').then(r=>r.text()).then(t=>{
  const match = t.match(/var FB_PUBLIC_LOAD_DATA_ = (.*?);/);
  if (match) {
    console.log(match[1]);
  } else {
    console.log("No match");
  }
});
