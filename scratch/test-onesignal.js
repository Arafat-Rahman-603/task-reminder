async function testPush() {
  const payload = {
    app_id: "dbb9cb21-25fc-4e13-b145-38e167e2e03b",
    include_aliases: {
      external_id: ["test-user-id"],
    },
    target_channel: "push",
    headings: { en: "Test" },
    contents: { en: "Test body" },
  };

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key YOUR_REST_API_KEY`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", data);
}

testPush();
