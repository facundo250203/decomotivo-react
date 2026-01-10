const bcrypt = require('bcryptjs');

const hashPassword = async () => {
  const password = 'Lucia2408'; // La contraseña que querés usar
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nEjecutá este SQL en MySQL Workbench:');
  console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'facundo250203@gmail.com';`);
};

hashPassword();