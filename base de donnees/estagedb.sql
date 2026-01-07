-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 07 jan. 2026 à 22:21
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `estagedb`
--

-- --------------------------------------------------------

--
-- Structure de la table `administrateur`
--

CREATE TABLE `administrateur` (
  `MATRICULEADMIN` varchar(255) NOT NULL,
  `NOMADMIN` varchar(255) NOT NULL,
  `PRENOMADMIN` varchar(255) NOT NULL,
  `EMAILADMIN` varchar(255) NOT NULL,
  `PASSWARDADMIN` varchar(255) NOT NULL,
  `PHOTOADMIN` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `administrateur`
--

INSERT INTO `administrateur` (`MATRICULEADMIN`, `NOMADMIN`, `PRENOMADMIN`, `EMAILADMIN`, `PASSWARDADMIN`, `PHOTOADMIN`) VALUES
('21D0164EP', 'DOUBLA', 'SENGUEL', 'sengueldoubla@gmail.com', '$2b$10$hYzPRrOsap3VsRyjIsFGQuMQyK8C98MG/83XlJsW6Hw4HSuSIeC2u', 'fb938af3-0026-4455-b621-3fa05c01f4a0.JPG'),
('sdrh', 'SDRH', 'INS', 'SDRH.INS@gmail.com', '$2b$10$Y.epntertrytRwqiJI.xA.pyb3vPFSIfh/q..KCkCLdWkdpazjc3e', '9faf8334-1160-4248-9f3a-b69541d38b3f.jpg');

-- --------------------------------------------------------

--
-- Structure de la table `attribuer`
--

CREATE TABLE `attribuer` (
  `MATRICULECHARGEDESTAGE` varchar(255) NOT NULL,
  `MATRICULEENCADREUR` varchar(255) NOT NULL,
  `IDDOSSIER` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `attribuer`
--

INSERT INTO `attribuer` (`MATRICULECHARGEDESTAGE`, `MATRICULEENCADREUR`, `IDDOSSIER`) VALUES
('sdrh', 'ENC002', 53),
('sdrh', 'ENC003', 52),
('sdrh', 'ENC003', 59),
('sdrh', 'ENC004', 50);

-- --------------------------------------------------------

--
-- Structure de la table `dossier`
--

CREATE TABLE `dossier` (
  `NUMERODEDOSSIER` int(255) NOT NULL,
  `MATRICULEETUDIANT` varchar(255) DEFAULT NULL,
  `DATEDEBUTDESEANCE` date DEFAULT NULL,
  `DATEFINDESEANCE` date DEFAULT NULL,
  `ETAT` text DEFAULT NULL,
  `THEME` varchar(500) DEFAULT NULL,
  `CNI` varchar(255) NOT NULL,
  `CERTIFICAT` varchar(255) NOT NULL,
  `LETTREMOTIVATION` varchar(255) NOT NULL,
  `LETTRERECOMMENDATION` varchar(255) NOT NULL,
  `PHOTOPROFIL` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `dossier`
--

INSERT INTO `dossier` (`NUMERODEDOSSIER`, `MATRICULEETUDIANT`, `DATEDEBUTDESEANCE`, `DATEFINDESEANCE`, `ETAT`, `THEME`, `CNI`, `CERTIFICAT`, `LETTREMOTIVATION`, `LETTRERECOMMENDATION`, `PHOTOPROFIL`) VALUES
(34, '21D0165EP', '2024-03-15', '2024-09-28', 'accepté', NULL, 'cb85ca24-2791-4ce5-a579-32d19e6599bc.pdf', '16fc7ba3-d9b6-4823-9264-e1b3da9704fc.pdf', '744e27c1-b929-4298-ae0e-4cfd42af00d4.pdf', '9e6ba524-1ae4-467b-9842-b92cc2bc4359.pdf', '270d303a-bfb3-479f-819a-fd9ce1398c5d.jpg'),
(35, '21D0167EP', '2024-03-24', '2024-09-28', 'accepté', NULL, '01b6705f-474e-4707-9df1-e05062af0c5b.pdf', '9aebd5a4-ec05-43ab-ac1e-e3fd9545d034.pdf', '06b08aec-5874-4600-84ca-34280597aa98.pdf', '8d9dd14e-8618-426a-8d48-22f12e19291a.pdf', '172feaa1-df86-42f6-8c14-26aba42e81c5.jpg'),
(36, 'ET0001', '2024-03-08', '2024-09-19', 'accepté', NULL, '2c6004b4-12b5-47a6-a5b2-e79b33f81240.pdf', '7c1f91a9-e1cd-49b5-8af5-ba463e0b4e13.pdf', '1e848a1f-f590-49af-bcd6-bc523cae2510.pdf', 'de91f679-ca48-4438-8db9-7b2ee3bc0286.pdf', '54716fef-e3b2-4bce-b37a-9a4a19af5508.jpg'),
(37, 'ET0002', '2024-03-31', '2024-09-06', 'accepté', NULL, 'd5c9829a-69d5-4ec5-b387-ee92cc1b3a5a.pdf', '09f678da-762e-4e29-b870-73c43b647ee1.pdf', '6d3ed075-5992-4372-a7c2-376308abade5.pdf', '76b6a804-91e2-4f60-8beb-36dd9dcedf34.pdf', '07e03071-b160-4779-bed0-0aaff2c8dc4e.jpg'),
(38, 'ET0003', '2024-03-22', '2024-09-06', 'accepté', NULL, '7131a843-d324-4ec9-affb-f4ec56385c68.pdf', '248476af-d432-4b05-b997-b78011066b06.pdf', '0977dfef-c06b-4a54-b624-3dc6e1f81468.pdf', '835de75b-5c23-4610-9454-d6787a619467.pdf', '1d33f2b8-b580-46ed-96d6-c4c3131b446c.jpg'),
(39, 'ET0004', '2024-03-21', '2024-09-07', 'non traité', NULL, '64c8f9b7-f994-4e60-86ab-64835e471d1f.pdf', '22009699-cea3-4992-bff4-c4afec161de4.pdf', '8d85fd9c-595e-4e3b-b1d8-d3d3c6bb14cc.pdf', '4ea95573-dbff-4f81-9e4b-b88f26cb17b7.pdf', 'cf7f1e8d-f0d7-4795-8bd3-eb86165228bd.jpg'),
(40, 'ET0005', '2024-03-14', '2024-09-08', 'non traité', NULL, 'e33e2a90-0da5-4b05-a534-55fc19110f5a.pdf', 'e9dae0cb-4df1-4aa2-93a2-5f1867563f67.pdf', 'e478287b-91a5-48da-9d71-5c251dfc29d6.pdf', '70831001-df7f-4105-a1d3-d8c8a2bf2120.pdf', '0bd553b8-721e-4eb3-96d4-e607975b502f.jpg'),
(41, 'ET0006', '2024-03-13', '2024-09-04', 'non traité', NULL, '32886cfb-346f-454e-a46f-cbd9b19fcd18.pdf', 'fa929d69-9157-4e71-aaab-dcc7755adbe4.pdf', 'fcff72a6-3c1b-40cd-a796-4157e59476da.pdf', 'cf7a753e-0a59-4c2d-a0d9-e125e842f058.pdf', '6befab08-79e1-46d9-870a-7b8f5235441f.jpg'),
(42, 'ET0007', '2024-03-14', '2024-09-04', 'non traité', NULL, '86152ffc-5b95-43f2-88dc-8b7e16ad01ca.pdf', '11a57af0-6f92-462d-bb92-d07a23822dfe.pdf', '9f87a085-1639-43b3-97bb-2fce390820e7.pdf', 'd84f9cfe-8e35-4549-b034-403b062a14a2.pdf', '829d1280-d535-4685-b775-354b7d94e4c4.jpg'),
(43, 'ET0008', '2024-06-03', '2024-09-01', 'accepté', NULL, 'ce6e7091-ac2e-4903-8c59-95c5811e1db1.pdf', '8c065b54-aeab-46f4-9ede-807a7bac693c.pdf', '9384eacc-4262-44f8-b03e-6995280b36f6.pdf', 'ffcfe64d-376a-4c25-852a-5481ed869304.pdf', '2ce732ba-431d-4cdc-be77-88a64711e276.jpg'),
(44, 'ET0009', '2024-06-04', '2024-07-04', 'non traité', NULL, 'c176facf-5804-4530-85d2-00565ca33c68.pdf', 'a424050f-f849-4d07-b9b0-eed7e1fb1a05.pdf', '07ee2a7f-06c1-447b-a20e-30ed4346c9fb.pdf', 'ddec9be6-3b6f-483a-93ae-763d149d0545.pdf', '3735dbff-ed90-463d-9b02-8fc45f9dbb1b.jpg'),
(45, 'ET00010', '2024-06-05', '2024-09-05', 'accepté', NULL, '0dca57d0-ce8b-4502-8252-4802a0871de1.pdf', 'dad81fb1-1b00-4407-b052-11efdd3eff3f.pdf', '7bb8e702-04a1-49f3-b63c-066057f25b6c.pdf', '83123d76-61a9-4f32-b9be-6b66e655bf73.pdf', 'a423e4db-6478-44a3-8f03-da0e888e1c6c.jpg'),
(46, 'ET00011', '2024-06-06', '2024-07-06', 'accepté', NULL, 'e23e907e-3315-4570-9ca7-83e7861e1ee7.pdf', 'ed875053-5c82-4492-8dcd-9970a6107d76.pdf', '0bd8f78d-c51e-431b-92a1-fff1f8962142.pdf', '850d82b2-a30c-4a0b-9e49-fc95b9f40d5c.pdf', 'd2758579-9a61-451e-ba60-99fc1452038f.jpg'),
(47, 'ET00012', '2024-06-07', '2024-07-07', 'accepté', NULL, 'f4323c20-a2eb-4429-ab47-26fd7106be1b.pdf', 'bd1006da-5b25-4aac-aa1b-d5c4a6e9e452.pdf', '676f843c-b5b3-4217-afe4-1e4d3880c594.pdf', 'a1886bae-711b-473d-9215-638406ed8f0b.pdf', '0c11efa3-29a0-4958-a616-fa756ce7387e.jpg'),
(48, 'ET00013', '2024-06-08', '2024-07-08', 'accepté', NULL, '86742611-1dfb-4f23-aee2-f9cae7d0b3d4.pdf', '4edffe4f-a0bb-4118-88a7-587ff3d14d5f.pdf', '7367f117-1371-4e84-bc06-10bb75252948.pdf', 'b0d04999-8fe4-48cd-8df6-059684e63579.pdf', '68ef6ccf-f68a-4c07-a30c-2cc4c7cb37b2.jpg'),
(49, 'ET00014', '2024-03-02', '2024-06-02', 'accepté', NULL, '1e95a00a-af4b-4bd3-8730-ea11b262cb81.pdf', '0ba6b7e7-8805-4367-93d7-873f64065cd9.pdf', 'ad6480c3-a288-45b6-aa94-eafd39549b41.pdf', '7ba44e3c-950b-4d49-96cb-264b16becb92.pdf', 'fff0af47-d80e-4761-9b1b-d49ca5839c67.jpg'),
(50, 'ET00015', '2024-06-08', '2024-09-08', 'accepté', 'DEVELOPEMENT D\'UNE APPLICATION POUR LA COMPTABILITE', '2114a2f1-c69f-488d-a55e-35974b49f2a1.pdf', '3eb5a7a5-2dd2-4132-8ab9-7b9ff7b7e23d.pdf', '18dc5829-e277-41a0-83ff-e1c1d690e053.pdf', '53a580b5-9898-4486-af1c-b3d7b5407dc4.pdf', '25879e19-761d-455b-9bae-8e83b9cbb47f.jpg'),
(51, 'ET00016', '2024-06-04', '2024-07-04', 'rejeté', NULL, '93babf7e-4d6c-44f3-bb15-a9690582838d.pdf', 'ad1da447-7708-46be-b1ba-d35482529079.pdf', '031bccc1-ab11-4b7d-9cc8-cbb79fd3c959.pdf', 'd62c2f8a-3048-43c6-8bae-eb36d5ca53e1.pdf', '51d72147-2a3b-4b0d-85d8-660f0fc5fad6.jpg'),
(52, 'ET00017', '2024-06-11', '2024-07-11', 'accepté', NULL, '94bfa75b-ab6f-4dc3-a20f-2d2e543ecbc7.pdf', 'f6666cbe-c886-456b-8b7f-7fd086d26a24.pdf', 'f7126a13-edf7-4cc4-88ac-d38b5a2aa654.pdf', '752d01e0-bdac-456d-9e57-b2e8b28519e4.pdf', 'e6f90fcd-ce3e-4f18-9fc7-6129d4d16159.jpg'),
(53, 'ET00018', '2024-05-14', '2024-07-14', 'accepté', NULL, '7cef1349-c64c-4e3c-bff2-0881e55fd989.pdf', '1fa126ba-60c8-45ec-9ab8-2d19581f4005.pdf', 'b869db8f-b331-4581-adc8-9c6cac25f955.pdf', '013a6170-2822-4d13-90db-8484500112f5.pdf', '4201e152-4d7a-4790-a0c9-2d82cf2dffbb.jpg'),
(54, 'ET00019', '2024-05-10', '2024-06-10', 'non traité', NULL, '946f6ff3-2c2a-4bf1-9333-ca4d1e6aeb53.pdf', '73b77741-8bf3-4f9c-86d1-d9fd6ef5ca62.pdf', 'f17a74b2-ce16-4ddb-92a8-63b7808d2e1c.pdf', '8ff5fb77-232d-4d86-8c27-25b41ccc5428.pdf', 'b5971a2c-f63c-4ed2-9b93-4e6390ad07cf.jpg'),
(55, 'ET00020', '2024-05-16', '2024-06-17', 'non traité', NULL, '6cf3ebf6-1b9a-4978-b5b9-bcac8ad2175c.pdf', 'e57a51a3-ee7a-4ef1-8905-07f37dd7eb8b.pdf', 'e4ab0ed9-510f-47ba-8729-f957d146eb78.pdf', 'df0dcb58-d9c9-4792-a4f4-7536186c3bc0.pdf', 'a5c6e1fa-d8d9-421b-8370-95d27f06294c.jpg'),
(56, 'ET00021', '2024-04-03', '2024-05-03', 'accepté', NULL, '1603683a-e346-454e-a244-bc3b5b5df06e.pdf', 'ede2c333-987f-4f69-92a3-b72baae02826.pdf', '5e0a6aff-762a-480a-85b3-7acd66bb5fef.pdf', '23d4d68d-21fb-4d38-8d1f-a6e56d03107d.pdf', '6ee22068-3180-4d7c-8e69-f7a36f6d55e9.jpg'),
(57, 'ET00022', '2024-04-09', '2024-05-09', 'non traité', NULL, '56a26357-80ea-4efe-8e67-dce0b47e3b38.pdf', 'cd8649a5-da16-4f70-aaa6-f435e7a6f901.pdf', '3bcad000-0a0c-43ba-b471-af2a6bae8b1d.pdf', 'c73622ee-c100-4066-90e3-e854bc3ab765.pdf', '0b415636-ebcb-4e23-b4a8-0ab0ee73739b.jpg'),
(58, 'ET00049', '2024-08-21', '2024-08-31', 'non traité', NULL, '3088565d-b787-48b8-9f4f-ef39eef59874.pdf', 'c31be1a0-92b5-4d7c-a310-632f9f4e103b.pdf', '6685781d-ea1d-4484-a1d5-f8975a8fdd7b.pdf', '4aca9a3a-91de-4ca0-9699-bf58c8e7da34.pdf', '852595da-6b12-4c7e-8c24-dc3b65f0b182.jpg'),
(59, 'ET00090', '2024-09-13', '2024-10-31', 'accepté', NULL, 'f8a223cc-c0f0-443c-a5b3-b1b4388c8b44.pdf', 'd70cf39d-9963-4b63-85fc-6b12d69eca5d.pdf', '01344e65-9c7f-4447-8c67-a3d2f8754764.pdf', 'f45da763-4cf0-4b0a-b66c-eed06a3c68bf.pdf', '5f1ec656-8b78-4f8e-bc56-407033755fe5.jpg'),
(60, 'ET00099', '2024-09-14', '2024-10-26', 'non traité', NULL, '4d402d04-3e8a-43db-867d-c1924a4c9f25.pdf', '801bf7a3-6243-4489-9430-da56fac4d037.pdf', 'aa3fa0a8-68d6-4e2c-9d85-6f8721e1a4cc.pdf', '7df1aa74-8624-4c02-98b9-b7d4b0b83d76.pdf', '644e494f-385b-4da7-b545-fb4f72c3e8e8.jpg');

-- --------------------------------------------------------

--
-- Structure de la table `encadreur`
--

CREATE TABLE `encadreur` (
  `MATRICULEENCADREUR` varchar(255) NOT NULL,
  `NOMENCADREUR` varchar(255) DEFAULT NULL,
  `PRENOMENCADREUR` varchar(255) DEFAULT NULL,
  `DEPARTEMENT` varchar(255) DEFAULT NULL,
  `DIVISION` varchar(255) NOT NULL,
  `POSTE` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `encadreur`
--

INSERT INTO `encadreur` (`MATRICULEENCADREUR`, `NOMENCADREUR`, `PRENOMENCADREUR`, `DEPARTEMENT`, `DIVISION`, `POSTE`) VALUES
('', '', '', 'Département des statistiques démographiques et sociales', 'Division des statistiques démographiques', ''),
('ENC001', 'Dupont', 'Jean', 'Département des statistiques démographiques et sociales', 'Division des statistiques sociales et du suivi de l’inflation', 'Analyste'),
('ENC002', 'Martin', 'Sophie', 'Département des statistiques démographiques et sociales', 'Division des statistiques sociales et du suivi de l’inflation', 'Statisticien'),
('ENC003', 'Leroy', 'Pierre', 'Département des statistiques démographiques et sociales', 'Division des statistiques sociales et du suivi de l’inflation', 'Technicien'),
('ENC004', 'Leclerc', 'Lucie', 'Département des statistiques démographiques et sociales', 'Division des statistiques sociales et du suivi de l’inflation', 'Chercheur'),
('ENC005', 'Bernard', 'Thomas', 'Département des statistiques démographiques et sociales', 'Division des statistiques sociales et du suivi de l’inflation', 'Coordinateur'),
('ENC006', 'Moreau', 'Chloé', 'Département des statistiques démographiques et sociales', 'Division des statistiques démographiques', 'Analyste'),
('ENC007', 'Garnier', 'Emma', 'Département des statistiques démographiques et sociales', 'Division des statistiques démographiques', 'Statisticien'),
('ENC008', 'Thomas', 'Alex', 'Département des statistiques démographiques et sociales', 'Division des statistiques démographiques', 'Technicien'),
('ENC009', 'Lemoine', 'Inès', 'Département des statistiques démographiques et sociales', 'Division des statistiques démographiques', 'Chercheur'),
('ENC010', 'Roux', 'Leo', 'Département des statistiques démographiques et sociales', 'Division des statistiques démographiques', 'Coordinateur'),
('ENC011', 'Blanc', 'Juliette', 'Département des statistiques démographiques et sociales', 'Division de la cartographie des statistiques sur l?environnement et les changements climatique', 'Analyste'),
('ENC012', 'Gauthier', 'Nicolas', 'Département des statistiques démographiques et sociales', 'Division de la cartographie des statistiques sur l?environnement et les changements climatique', 'Statisticien'),
('ENC013', 'Pires', 'Anna', 'Département des statistiques démographiques et sociales', 'Division de la cartographie des statistiques sur l?environnement et les changements climatique', 'Technicien'),
('ENC014', 'Gilbert', 'Ethan', 'Département des statistiques démographiques et sociales', 'Division de la cartographie des statistiques sur l?environnement et les changements climatique', 'Chercheur'),
('ENC015', 'Boucher', 'Alice', 'Département des statistiques démographiques et sociales', 'Division de la cartographie des statistiques sur l?environnement et les changements climatique', 'Coordinateur'),
('ENC016', 'Renaud', 'Mélanie', 'Département des statistiques d\'entreprise', 'Secrétariat Permanent du Plan Comptable', 'Comptable'),
('ENC017', 'Chevalier', 'Gabriel', 'Département des statistiques d\'entreprise', 'Secrétariat Permanent du Plan Comptable', 'Analyste'),
('ENC018', 'Barret', 'Zoé', 'Département des statistiques d\'entreprise', 'Secrétariat Permanent du Plan Comptable', 'Technicien'),
('ENC019', 'Cardin', 'Julien', 'Département des statistiques d\'entreprise', 'Secrétariat Permanent du Plan Comptable', 'Coordinateur'),
('ENC020', 'Collet', 'Clara', 'Département des statistiques d\'entreprise', 'Secrétariat Permanent du Plan Comptable', 'Chercheur'),
('ENC021', 'Perret', 'Louis', 'Département des statistiques d\'entreprise', 'Division des Statistiques des Secteurs Productifs', 'Analyste'),
('ENC022', 'Leblanc', 'Léa', 'Département des statistiques d\'entreprise', 'Division des Statistiques des Secteurs Productifs', 'Statisticien'),
('ENC023', 'Fournier', 'Hugo', 'Département des statistiques d\'entreprise', 'Division des Statistiques des Secteurs Productifs', 'Technicien'),
('ENC024', 'Simon', 'Nina', 'Département des statistiques d\'entreprise', 'Division des Statistiques des Secteurs Productifs', 'Coordinateur'),
('ENC025', 'Lemoine', 'Maxime', 'Département des statistiques d\'entreprise', 'Division des Statistiques des Secteurs Productifs', 'Chercheur'),
('ENC026', 'Pichon', 'Sonia', 'Département des synthèses économiques', 'Division de la Comptabilité Nationale', 'Analyste'),
('ENC027', 'Giraud', 'Mathis', 'Département des synthèses économiques', 'Division de la Comptabilité Nationale', 'Statisticien'),
('ENC028', 'Roussel', 'Lola', 'Département des synthèses économiques', 'Division de la Comptabilité Nationale', 'Technicien'),
('ENC029', 'Leroy', 'Théo', 'Département des synthèses économiques', 'Division de la Comptabilité Nationale', 'Coordinateur'),
('ENC030', 'Guillaume', 'Emma', 'Département des synthèses économiques', 'Division de la Comptabilité Nationale', 'Chercheur'),
('ENC031', 'Aubry', 'Lucas', 'Département des synthèses économiques', 'Division des Analyses Conjoncturelles', 'Analyste'),
('ENC032', 'Dufour', 'Maya', 'Département des synthèses économiques', 'Division des Analyses Conjoncturelles', 'Statisticien'),
('ENC033', 'Bourgeois', 'Matthieu', 'Département des synthèses économiques', 'Division des Analyses Conjoncturelles', 'Technicien'),
('ENC034', 'Charpentier', 'Chloé', 'Département des synthèses économiques', 'Division des Analyses Conjoncturelles', 'Coordinateur'),
('ENC035', 'Lefebvre', 'Antoine', 'Département des synthèses économiques', 'Division des Analyses Conjoncturelles', 'Chercheur'),
('ENC036', 'Bouchard', 'Luc', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coordination Statistique et de la Diffusion', 'Analyste'),
('ENC037', 'Delaunay', 'Céline', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coordination Statistique et de la Diffusion', 'Statisticien'),
('ENC038', 'Garnier', 'Olivier', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coordination Statistique et de la Diffusion', 'Technicien'),
('ENC039', 'Meyer', 'Paul', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coordination Statistique et de la Diffusion', 'Coordinateur'),
('ENC040', 'Lebrun', 'Claire', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coordination Statistique et de la Diffusion', 'Chercheur'),
('ENC041', 'Marchand', 'Jules', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coopération, de la Révision et de la Recherche Appliquée', 'Analyste'),
('ENC042', 'Pereira', 'Elise', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coopération, de la Révision et de la Recherche Appliquée', 'Statisticien'),
('ENC043', 'Vasseur', 'Noah', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coopération, de la Révision et de la Recherche Appliquée', 'Technicien'),
('ENC044', 'Dupuis', 'Anaïs', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coopération, de la Révision et de la Recherche Appliquée', 'Coordinateur'),
('ENC045', 'Rivière', 'Victor', 'Département de la coordination statistique, de la coopération et de la recherche', 'Division de la Coopération, de la Révision et de la Recherche Appliquée', 'Chercheur'),
('ENC046', 'Bourguignon', 'Lina', 'Département de l\'informatique', 'Division des Traitements et des Systèmes d?Information Géographique', 'Développeur'),
('ENC047', 'Lemaire', 'Samuel', 'Département de l\'informatique', 'Division des Traitements et des Systèmes d?Information Géographique', 'Analyste'),
('ENC048', 'Caron', 'Léon', 'Département de l\'informatique', 'Division des Traitements et des Systèmes d?Information Géographique', 'Technicien'),
('ENC049', 'Charon', 'Ines', 'Département de l\'informatique', 'Division des Traitements et des Systèmes d?Information Géographique', 'Coordinateur'),
('ENC050', 'Coulon', 'Nicolas', 'Département de l\'informatique', 'Division des Traitements et des Systèmes d?Information Géographique', 'Chef de projet'),
('ENC051', 'Vignaud', 'Clément', 'Département de l\'informatique', 'Division du Développement des Applications et de la Maintenance', 'Développeur'),
('ENC052', 'Laurent', 'Aline', 'Département de l\'informatique', 'Division du Développement des Applications et de la Maintenance', 'Analyste'),
('ENC053', 'Martel', 'Chloé', 'Département de l\'informatique', 'Division du Développement des Applications et de la Maintenance', 'Technicien'),
('ENC054', 'Mottet', 'Paul', 'Département de l\'informatique', 'Division du Développement des Applications et de la Maintenance', 'Coordinateur'),
('ENC055', 'Roussel', 'Lucie', 'Département de l\'informatique', 'Division du Développement des Applications et de la Maintenance', 'Chef de projet');

-- --------------------------------------------------------

--
-- Structure de la table `etudiant`
--

CREATE TABLE `etudiant` (
  `MATRICULEETUDIANT` varchar(255) NOT NULL,
  `NOMETUDIANT` varchar(255) DEFAULT NULL,
  `PRENOMETUDIANT` varchar(255) DEFAULT NULL,
  `ETABLISSEMENT` varchar(255) DEFAULT NULL,
  `VILLERESIDENCE` varchar(255) DEFAULT NULL,
  `PARCOURS` varchar(255) DEFAULT NULL,
  `NIVEAU` varchar(255) DEFAULT NULL,
  `EMAIL` text NOT NULL,
  `TEL` varchar(255) NOT NULL,
  `FILIERE` varchar(255) NOT NULL,
  `SEXE` text NOT NULL,
  `DATE` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `etudiant`
--

INSERT INTO `etudiant` (`MATRICULEETUDIANT`, `NOMETUDIANT`, `PRENOMETUDIANT`, `ETABLISSEMENT`, `VILLERESIDENCE`, `PARCOURS`, `NIVEAU`, `EMAIL`, `TEL`, `FILIERE`, `SEXE`, `DATE`) VALUES
('21D0165EP', 'FANTA', 'SENGUEL', 'Ecole Nationale Supérieure Polytechnique de Maroua', 'MAROUA', 'INGENIEUR DE CONCEPTION', '4', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'Génie Logiciel', 'F', '2024-06-27 15:23:54'),
('21D0167EP', 'ATEBA', 'HERMANN', 'Ecole Nationale Supérieure Polytechnique de Maroua', 'MAROUA', 'INGENIEUR DE CONCEPTION', '4', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'Génie Logiciel', '', '2024-06-28 14:04:00'),
('ET0001', 'DAMBA', 'CLAUDINE', 'Ecole Nationale Supérieure Polytechnique de Maroua', 'MAROUA', 'INGENIEUR DE CONCEPTION', '5', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'Economie', 'F', '2024-06-28 22:24:02'),
('ET00010', 'CAZERA', 'ROUNY', 'UNIVERSITE DE GAROUA', 'GAROUA', 'MASTER', '1', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYSIQUE', '', '2024-06-28 22:59:53'),
('ET00011', 'LOUMOUDA', 'MONIC', 'UNIVERSITE DE GAROUA', 'GAROUA', 'MASTER', '1', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYSIQUE', 'F', '2024-06-28 23:02:41'),
('ET00012', 'LOURASSIA', 'CLARISSE', 'UNIVERSITE DE BERTOUA', 'BERTOUA', 'MASTER', '1', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYSIQUE', 'F', '2024-06-28 23:06:41'),
('ET00013', 'LANHIMI', 'ROSE', 'UNIVERSITE DE BERTOUA', 'BERTOUA', 'MASTER', '1', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYSIQUE', 'F', '2024-08-28 23:08:51'),
('ET00014', 'LANDA', 'ROSE', 'UNIVERSITE DE BERTOUA', 'BERTOUA', 'MASTER', '1', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYLOSOPHY', 'F', '2024-06-28 23:13:05'),
('ET00015', 'NGANOU', 'FRANCIS', 'UNIVERSITE DE BERTOUA', 'BERTOUA', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYLOSOPHY', '', '2024-07-28 23:19:36'),
('ET00016', 'LEONNEL', 'MESSI', 'UNIVERSITE DE BERTOUA', 'BERTOUA', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'BIOLOGY', '', '2024-06-28 23:21:58'),
('ET00017', 'LEONNEL', 'YOUSSOUPHA', 'UNIVERSITE DE DOUALA', 'BERTOUA', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'BIOLOGY', '', '2024-06-28 23:24:15'),
('ET00018', 'MWASSO', 'GABRIELLA', 'UNIVERSITE DE DOUALA', 'BERTOUA', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'BIOLOGY', 'F', '2024-05-28 23:26:16'),
('ET00019', 'GUINA', 'LUCIE', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'BIOLOGY', 'F', '2024-05-28 23:29:21'),
('ET0002', 'AWIRA', 'ASHLEY', 'UIT', 'NGAOUNDERE', 'MASTER', '3', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'INFORMATIQUE', '', '2024-04-28 22:31:26'),
('ET00020', 'ETAKA', 'JUSTINE', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'BIOLOGY', 'F', '2024-08-28 23:32:15'),
('ET00021', 'MLANOU', 'ALFRED', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'CHIMIE', '', '2024-08-28 23:35:00'),
('ET00022', 'ZIENGOULA', 'CHANOL', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'CHIMIE', 'F', '2024-04-29 06:18:03'),
('ET0003', 'AWARA', 'FAITH', 'UIT', 'NGAOUNDERE', 'MASTER', '3', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'INFORMATIQUE', 'F', '2024-04-28 22:35:28'),
('ET0004', 'AMOUGOU', 'MEGANE', 'UNIVERSITE DE NGAOUNDERE', 'NGAOUNDERE', 'MASTER', '3', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'INFORMATIQUE', 'F', '2024-03-28 22:39:26'),
('ET00049', 'ZIENGOULA', 'CHANOL', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'CHIMIE', '', '2024-08-30 11:44:58'),
('ET0005', 'MOHAMED', 'ALI', 'UNIVERSITE DE NGAOUNDERE', 'NGAOUNDERE', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'INFORMATIQUE', '', '2024-03-28 22:42:13'),
('ET0006', 'MOHAMADOU', 'BAJIROU', 'UNIVERSITE DE NGAOUNDERE', 'NGAOUNDERE', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'MATHEMATIQUE', '', '2024-02-28 22:45:57'),
('ET0007', 'MOHAMADOU', 'BAJIR', 'UNIVERSITE DE NGAOUNDERE', 'NGAOUNDERE', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'MATHEMATIQUE', '', '2024-02-28 22:48:47'),
('ET0008', 'MOHALA', 'BAKAR', 'UNIVERSITE DE NGAOUNDERE', 'NGAOUNDERE', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYSIQUE', '', '2024-01-28 22:51:38'),
('ET0009', 'MOULA', 'RONY', 'UNIVERSITE DE YAOUNDE', 'NGAOUNDERE', 'MASTER', '1', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'PHYSIQUE', '', '2024-01-28 22:55:26'),
('ET00090', 'ZIENGOULAD', 'CHANOLJ', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'STATISTIQUES', '', '2024-09-05 08:51:43'),
('ET00099', 'FOUE', 'JUNIOR', 'UNIVERSITE DE NCHANG', 'NCHANG', 'MASTER', '2', 'sengueldoubla@gmail.com', '+237 693 85 13 00', 'STATISTIQUES', 'M', '2024-09-05 10:13:33');

-- --------------------------------------------------------

--
-- Structure de la table `rapport`
--

CREATE TABLE `rapport` (
  `IDDOSSIER` int(11) NOT NULL,
  `MATRICULE` varchar(30) NOT NULL,
  `COMMENTAIRE` varchar(50) NOT NULL,
  `THEME` varchar(255) NOT NULL,
  `FICHIER` varchar(255) NOT NULL,
  `DATE` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `rapport`
--

INSERT INTO `rapport` (`IDDOSSIER`, `MATRICULE`, `COMMENTAIRE`, `THEME`, `FICHIER`, `DATE`) VALUES
(1, 'ET0008', 'utile', 'Mise sur pied d\'une application web pour le suivi du projet CAMPHIA', 'dc3dae00-4077-4fe6-8087-217b72733591.pdf', '2024-08-30 10:27:00'),
(2, 'ET0006', 'utile', 'Mise en place d\'une application web pour le suivi du projet CAMPHIA', '3f780f05-84b9-4962-8481-7087d283d76d.pdf', '2024-08-30 10:29:03'),
(3, 'ET00090', 'utile', 'MISE EN PLACE D\'UN MECANISME DE GESTION DE STAGE DE STAGE DE L\'INS', 'd9eeef4f-a7db-47fa-b3ea-c3a281c0a583.pdf', '2024-09-05 08:56:14'),
(4, 'ET00015', 'utile', 'DEVELOPPEMENT D\'UN MECANISME POUR LA GESTION DES STAGES DE L\'INS EN LIGNE', '2e297b4f-2fe6-4734-a336-1b5c78ff1d98.pdf', '2024-09-05 10:16:54'),
(5, 'ET00014', 'important', 'test', '5f7cca84-f087-4d32-8f85-3ce86f9bb168.pdf', '2024-09-10 21:25:11'),
(6, 'ET00013', 'utile', 'test agzz', '807f2c33-ccf9-45b8-9a9a-f0c46f8a6fe4.pdf', '2024-09-10 21:47:04');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `administrateur`
--
ALTER TABLE `administrateur`
  ADD PRIMARY KEY (`MATRICULEADMIN`);

--
-- Index pour la table `attribuer`
--
ALTER TABLE `attribuer`
  ADD PRIMARY KEY (`MATRICULECHARGEDESTAGE`,`MATRICULEENCADREUR`,`IDDOSSIER`),
  ADD KEY `FK_ATTRIBUER` (`MATRICULEENCADREUR`),
  ADD KEY `IDDOSSIER` (`IDDOSSIER`),
  ADD KEY `IDDOSSIER_2` (`IDDOSSIER`),
  ADD KEY `IDDOSSIER_3` (`IDDOSSIER`);

--
-- Index pour la table `dossier`
--
ALTER TABLE `dossier`
  ADD PRIMARY KEY (`NUMERODEDOSSIER`),
  ADD KEY `FK_DEPOSER` (`MATRICULEETUDIANT`);

--
-- Index pour la table `encadreur`
--
ALTER TABLE `encadreur`
  ADD PRIMARY KEY (`MATRICULEENCADREUR`);

--
-- Index pour la table `etudiant`
--
ALTER TABLE `etudiant`
  ADD PRIMARY KEY (`MATRICULEETUDIANT`);

--
-- Index pour la table `rapport`
--
ALTER TABLE `rapport`
  ADD PRIMARY KEY (`IDDOSSIER`),
  ADD KEY `MATRICULE` (`MATRICULE`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `dossier`
--
ALTER TABLE `dossier`
  MODIFY `NUMERODEDOSSIER` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT pour la table `rapport`
--
ALTER TABLE `rapport`
  MODIFY `IDDOSSIER` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `attribuer`
--
ALTER TABLE `attribuer`
  ADD CONSTRAINT `FK_ATTRIBUER` FOREIGN KEY (`MATRICULEENCADREUR`) REFERENCES `encadreur` (`MATRICULEENCADREUR`),
  ADD CONSTRAINT `FK_ATTRIBUER2` FOREIGN KEY (`MATRICULECHARGEDESTAGE`) REFERENCES `administrateur` (`MATRICULEADMIN`),
  ADD CONSTRAINT `attribuer_ibfk_1` FOREIGN KEY (`IDDOSSIER`) REFERENCES `dossier` (`NUMERODEDOSSIER`);

--
-- Contraintes pour la table `dossier`
--
ALTER TABLE `dossier`
  ADD CONSTRAINT `FK_DEPOSER` FOREIGN KEY (`MATRICULEETUDIANT`) REFERENCES `etudiant` (`MATRICULEETUDIANT`);

--
-- Contraintes pour la table `rapport`
--
ALTER TABLE `rapport`
  ADD CONSTRAINT `rapport_ibfk_1` FOREIGN KEY (`MATRICULE`) REFERENCES `etudiant` (`MATRICULEETUDIANT`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
