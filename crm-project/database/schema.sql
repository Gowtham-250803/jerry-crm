-- FlowCRM Database schema placeholder
-- Put database tables and migrations here

CREATE TABLE IF NOT EXISTS contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  company VARCHAR(100),
  status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100),
  value DECIMAL(10, 2),
  status VARCHAR(50)
);
