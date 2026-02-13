import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('walid', 10);
console.log(hash);
