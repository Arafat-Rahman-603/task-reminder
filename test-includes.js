const message = 'OneSignal API error: ["All included players are not subscribed"]';
const isSubscriptionError = message.includes("All included players are not subscribed");
console.log(isSubscriptionError);
