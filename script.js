// RPG de Vie - Script principal
// Gère la logique du jeu, les calculs d'XP, les niveaux et la sauvegarde

// ===== CONFIGURATION DU JEU =====
const CONFIG = {
    INITIAL_LEVEL_XP: 2000,     // XP requis pour le niveau 1
    XP_INCREMENT_PER_LEVEL: 500, // Augmentation d'XP par niveau
    DAILY_XP: {                 // XP quotidienne par habitude
        SPORT: 27,
        TEACHING: 18.72,
        BUSINESS: 37.5
    }
};

// ===== ÉTAT DU JEU =====
let gameState = {
    totalXP: 0,
    level: 1,
    days: 0,
    completedQuests: [],
    lastUpdate: new Date().toISOString()
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    loadGameState();
    initializeUI();
    updateUI();
    renderCharacter();
});

// ===== SYSTÈME DE NIVEAUX =====
/**
 * Calcule l'XP requise pour un niveau donné
 * @param {number} level - Le niveau pour lequel calculer l'XP requise
 * @returns {number} L'XP requise pour atteindre ce niveau
 */
function getXPForLevel(level) {
    // Formule: XP(niveau) = 2000 + (niveau-1) * 500
    return CONFIG.INITIAL_LEVEL_XP + (level - 1) * CONFIG.XP_INCREMENT_PER_LEVEL;
}

/**
 * Calcule le niveau actuel et l'XP du niveau en cours
 * @param {number} totalXP - XP totale cumulée
 * @returns {object} Infos sur le niveau actuel
 */
function calculateLevelInfo(totalXP) {
    let level = 1;
    let xpForNextLevel = CONFIG.INITIAL_LEVEL_XP;
    let xpConsumed = 0;
    let xpInCurrentLevel = totalXP;
    
    // Trouver le niveau actuel
    while (xpInCurrentLevel >= xpForNextLevel) {
        xpConsumed += xpForNextLevel;
        xpInCurrentLevel -= xpForNextLevel;
        level++;
        xpForNextLevel = getXPForLevel(level);
    }
    
    // Calculer le pourcentage de progression
    const progressPercent = (xpInCurrentLevel / xpForNextLevel) * 100;
    
    return {
        level,
        xpForNextLevel,
        xpConsumed,
        xpInCurrentLevel,
        progressPercent: Math.min(100, Math.round(progressPercent * 10) / 10)
    };
}

/**
 * Vérifie si le joueur doit monter de niveau et gère la montée si nécessaire
 * @param {number} oldTotalXP - Ancienne XP totale (avant l'ajout)
 * @param {number} newTotalXP - Nouvelle XP totale (après l'ajout)
 */
function checkLevelUp(oldTotalXP, newTotalXP) {
    const oldLevelInfo = calculateLevelInfo(oldTotalXP);
    const newLevelInfo = calculateLevelInfo(newTotalXP);
    
    if (newLevelInfo.level > oldLevelInfo.level) {
        // Niveau augmenté!
        const levelsGained = newLevelInfo.level - oldLevelInfo.level;
        
        // Animation de niveau
        document.getElementById('current-level').classList.add('level-up');
        setTimeout(() => {
            document.getElementById('current-level').classList.remove('level-up');
        }, 500);
        
        // Message dans le journal
        addJournalEntry(`🎉 FÉLICITATIONS! Vous êtes passé au niveau ${newLevelInfo.level}!`, 'level-up');
        
        // Mise à jour du personnage
        renderCharacter();
        
        // Vérifier si c'est un niveau spécial
        if (newLevelInfo.level % 5 === 0) {
            addJournalEntry(`🌟 Niveau ${newLevelInfo.level} atteint! Votre personnage a évolué!`, 'special');
        }
    }
}

// ===== GESTION DE L'XP =====
/**
 * Ajoute de l'XP au joueur
 * @param {number} xp - Quantité d'XP à ajouter
 * @param {string} source - Source de l'XP (pour le journal)
 */
function addXP(xp, source = '') {
    const oldTotalXP = gameState.totalXP;
    gameState.totalXP += xp;
    
    // Vérifier la montée de niveau
    checkLevelUp(oldTotalXP, gameState.totalXP);
    
    // Sauvegarder et mettre à jour l'interface
    saveGameState();
    updateUI();
    
    // Animation sur la barre d'XP
    document.getElementById('xp-bar').classList.add('xp-gain');
    setTimeout(() => {
        document.getElementById('xp-bar').classList.remove('xp-gain');
    }, 800);
    
    // Message dans le journal si spécifié
    if (source) {
        addJournalEntry(`+${xp} XP (${source})`, 'xp-gain');
    }
}

/**
 * Ajoute l'XP quotidienne (habitudes)
 */
function addDailyXP() {
    const dailyXP = CONFIG.DAILY_XP.SPORT + CONFIG.DAILY_XP.TEACHING + CONFIG.DAILY_XP.BUSINESS;
    gameState.days++;
    addXP(dailyXP, 'Habitudes quotidiennes');
    addJournalEntry(`📅 Jour ${gameState.days} complété!`, 'daily');
}

// ===== INTERFACE UTILISATEUR =====
/**
 * Initialise les écouteurs d'événements
 */
function initializeUI() {
    // Bouton "Jour Suivant"
    document.getElementById('next-day-btn').addEventListener('click', function() {
        addDailyXP();
    });
    
    // Bouton "Ajouter 100 XP" (debug)
    document.getElementById('add-xp-btn').addEventListener('click', function() {
        addXP(100, 'Test');
    });
    
    // Boutons de quêtes
    document.querySelectorAll('.btn-quest-complete').forEach(button => {
        button.addEventListener('click', function() {
            const questElement = this.closest('.quest');
            const questName = questElement.querySelector('.quest-name').textContent;
            const questXP = parseInt(questElement.get
