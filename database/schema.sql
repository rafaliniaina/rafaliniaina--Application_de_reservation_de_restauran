-- ============================================================
-- RestaurantApp Varatra — Schéma MySQL complet
-- Base de données : restaurant_db_varatra
-- ============================================================

CREATE DATABASE IF NOT EXISTS restaurant_db_varatra
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_db_varatra;

-- Rôles : 1=client, 2=owner, 3=admin
CREATE TABLE roles (
  id   TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles (name) VALUES ('client'), ('owner'), ('admin');

-- Utilisateurs
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  first_name    VARCHAR(80)  NOT NULL,
  last_name     VARCHAR(80)  NOT NULL,
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20)  NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- Restaurants
CREATE TABLE restaurants (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id         INT UNSIGNED NULL,
  name             VARCHAR(150) NOT NULL,
  slug             VARCHAR(170) NOT NULL UNIQUE,
  description      TEXT         NULL,
  address          VARCHAR(255) NOT NULL,
  city             VARCHAR(100) NOT NULL,
  phone            VARCHAR(20)  NULL,
  email            VARCHAR(191) NULL,
  cuisine_type     VARCHAR(100) NULL,
  price_range      TINYINT      NOT NULL DEFAULT 2,
  cover_image      VARCHAR(500) NULL,
  approval_status  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500) NULL,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rest_owner FOREIGN KEY (owner_id)
    REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (approval_status),
  INDEX idx_owner  (owner_id)
) ENGINE=InnoDB;

-- Tables physiques
CREATE TABLE `tables` (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED  NOT NULL,
  table_number  VARCHAR(10)   NOT NULL,
  capacity      TINYINT       NOT NULL DEFAULT 2,
  is_available  BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_tables_rest FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_table (restaurant_id, table_number)
) ENGINE=InnoDB;

-- Réservations
CREATE TABLE reservations (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED NOT NULL,
  restaurant_id     INT UNSIGNED NOT NULL,
  table_id          INT UNSIGNED NULL,
  reservation_date  DATE         NOT NULL,
  reservation_time  TIME         NOT NULL,
  party_size        TINYINT      NOT NULL DEFAULT 2,
  status            ENUM('pending','confirmed','cancelled','completed','no_show')
                    NOT NULL DEFAULT 'pending',
  special_requests  TEXT         NULL,
  confirmation_code VARCHAR(12)  NOT NULL UNIQUE,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resv_user  FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_resv_rest  FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id) ON DELETE CASCADE,
  CONSTRAINT fk_resv_table FOREIGN KEY (table_id)
    REFERENCES `tables`(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_rest (restaurant_id),
  INDEX idx_date (reservation_date)
) ENGINE=InnoDB;

-- Avis
CREATE TABLE reviews (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  restaurant_id INT UNSIGNED NOT NULL,
  rating        TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rev_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_rest FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (user_id, restaurant_id)
) ENGINE=InnoDB;

-- ============================================================
-- Données de test — 6 restaurants approuvés
-- ============================================================
INSERT INTO restaurants
  (name, slug, description, address, city, cuisine_type, price_range,
   cover_image, approval_status, is_active)
VALUES
  ('Le Petit Bistro','le-petit-bistro',
   'Cuisine française traditionnelle dans un cadre chaleureux.',
   '12 Rue de la Paix','Paris','Française',2,
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
   'approved',TRUE),
  ('Sakura Sushi','sakura-sushi',
   'Sushis frais préparés par un chef japonais certifié.',
   '5 Avenue des Fleurs','Lyon','Japonaise',3,
   'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
   'approved',TRUE),
  ('La Bella Italia','la-bella-italia',
   'Pâtes fraîches et pizzas au feu de bois.',
   '8 Boulevard Victor Hugo','Marseille','Italienne',1,
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
   'approved',TRUE),
  ('Le Jardin Secret','le-jardin-secret',
   'Restaurant végétarien bio avec terrasse.',
   '23 Rue des Lilas','Bordeaux','Végétarienne',2,
   'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
   'approved',TRUE),
  ('Spice of India','spice-of-india',
   'Cuisine indienne authentique, épices importées.',
   '45 Rue du Commerce','Paris','Indienne',2,
   'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
   'approved',TRUE),
  ('Le Steak House','le-steak-house',
   'Viandes maturées et burgers artisanaux.',
   '7 Avenue de la Gare','Lyon','Américaine',2,
   'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
   'approved',TRUE);

-- Tables pour chaque restaurant
INSERT INTO `tables` (restaurant_id, table_number, capacity) VALUES
  (1,'T01',2),(1,'T02',4),(1,'T03',6),
  (2,'T01',2),(2,'T02',4),(2,'T03',6),
  (3,'T01',2),(3,'T02',4),(3,'T03',8),
  (4,'T01',2),(4,'T02',4),(4,'T03',6),
  (5,'T01',2),(5,'T02',4),(5,'T03',6),
  (6,'T01',2),(6,'T02',4),(6,'T03',8);