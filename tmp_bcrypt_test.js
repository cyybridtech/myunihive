const bcrypt = require('bcryptjs');
const hash = '$2y$10$5Qv4H6Z6oKqV3jY8nPqZ.eYq3pL5mN7oR8tU9vW0xY1zA2bC3dE';
const password = 'test';
console.log('compare test:', bcrypt.compareSync(password, hash));
