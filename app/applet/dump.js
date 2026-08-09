import 'dotenv/config';

async function test() {
  const code = `
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'process_installment_payment';
  `;
  console.log("No pg directly");
}
test();
