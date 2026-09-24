CREATE DATABASE IF NOT EXISTS vaccination_db;
USE vaccination_db;

-- 1. Users Table (Authentication & Central Account Info)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'centre', 'parent') NOT NULL,
    reset_otp VARCHAR(10) DEFAULT NULL,
    reset_otp_expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Vaccination Centres Table
CREATE TABLE IF NOT EXISTS centres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    working_hours VARCHAR(100) DEFAULT '09:00 AM - 05:00 PM',
    license_number VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_centre_status (status),
    INDEX idx_centre_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Parents Profile Table
CREATE TABLE IF NOT EXISTS parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Children Profile Table
CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    blood_group VARCHAR(10) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    INDEX idx_child_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Master Vaccine Schedule Rules Table
CREATE TABLE IF NOT EXISTS vaccine_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_name VARCHAR(100) NOT NULL,
    dose_number INT NOT NULL DEFAULT 1,
    offset_days INT NOT NULL COMMENT 'Days from child DOB when dose is due',
    target_disease VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_vaccine_dose (vaccine_name, dose_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Child Vaccination Records Table
CREATE TABLE IF NOT EXISTS child_vaccination_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    vaccine_rule_id INT NOT NULL,
    preferred_centre_id INT DEFAULT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'completed', 'overdue') DEFAULT 'pending',
    administered_date DATE DEFAULT NULL,
    batch_number VARCHAR(100) DEFAULT NULL,
    administered_by_centre_id INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    reminder_sent_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_rule_id) REFERENCES vaccine_rules(id) ON DELETE RESTRICT,
    FOREIGN KEY (preferred_centre_id) REFERENCES centres(id) ON DELETE SET NULL,
    FOREIGN KEY (administered_by_centre_id) REFERENCES centres(id) ON DELETE SET NULL,
    INDEX idx_record_child (child_id),
    INDEX idx_record_due_status (due_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Centre Vaccine Stock / Inventory Table
CREATE TABLE IF NOT EXISTS centre_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    centre_id INT NOT NULL,
    vaccine_name VARCHAR(100) NOT NULL,
    available_doses INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE,
    UNIQUE KEY uk_centre_vaccine (centre_id, vaccine_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
