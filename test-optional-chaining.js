const user_name = undefined;
try {
  console.log(user_name?.charAt(0).toUpperCase());
} catch (e) {
  console.log("Error 1", e.message);
}

const user_name2 = "";
try {
  console.log(user_name2?.charAt(0).toUpperCase());
} catch (e) {
  console.log("Error 2:", e.message);
}
