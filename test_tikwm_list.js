async function test() {
  const response = await fetch("https://www.tikwm.com/api/feed/list?region=VN&count=10", {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  });
  const data = await response.text();
  console.log(data.substring(0, 100));
}
test();
