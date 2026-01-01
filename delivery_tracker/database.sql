-- Delivery Tracking System Database Schema
-- Run this in phpMyAdmin or MySQL CLI

CREATE DATABASE IF NOT EXISTS delivery_tracker;
USE delivery_tracker;

-- Table for deliveries
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_code VARCHAR(32) UNIQUE NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    package_description VARCHAR(255),
    status ENUM('pending', 'location_received', 'delivered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for location data (with consent)
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT,
    consent_given BOOLEAN DEFAULT TRUE,
    consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_tracking_code ON deliveries(tracking_code);
CREATE INDEX idx_status ON deliveries(status);
