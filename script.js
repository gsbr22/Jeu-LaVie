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
            const questXP = parseInt(questElement.getAttribute('data-xp'));
            
            // Vérifier si la quête n'a pas déjà été complétée
            if (!gameState.completedQuests.includes(questName)) {
                // Ajouter la quête aux quêtes complétées
                gameState.completedQuests.push(questName);
                
                // Ajouter l'XP de la quête
                addXP(questXP, questName);
                
                // Désactiver le bouton
                this.textContent = 'Déjà complétée';
                this.disabled = true;
                this.style.background = '#666';
                this.style.cursor = 'not-allowed';
                
                // Message spécial dans le journal
                addJournalEntry(`🏆 Quête accomplie: ${questName}!`, 'quest');
            }
        });
    });
    
    // Onglets des quêtes
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Retirer la classe active de tous les onglets
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.quest-tab-content').forEach(c => c.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet sélectionné
            this.classList.add('active');
            document.getElementById(`${tabId}-quests`).classList.add('active');
        });
    });
    
    // Bouton de sauvegarde
    document.getElementById('save-btn').addEventListener('click', function() {
        saveGameState();
        addJournalEntry('💾 Partie sauvegardée avec succès!', 'save');
        this.textContent = 'Sauvegardé!';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-save"></i> Sauvegarder';
        }, 2000);
    });
    
    // Bouton de réinitialisation
    document.getElementById('reset-btn').addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression? Cette action est irréversible.')) {
            resetGameState();
            addJournalEntry('🔄 Partie réinitialisée. Nouvelle aventure commence!', 'reset');
        }
    });
}

/**
 * Met à jour toute l'interface utilisateur
 */
function updateUI() {
    const levelInfo = calculateLevelInfo(gameState.totalXP);
    
    // Mettre à jour le niveau
    document.getElementById('current-level').textContent = levelInfo.level;
    document.getElementById('level-badge').textContent = `Niveau ${levelInfo.level}`;
    
    // Mettre à jour les informations d'XP
    document.getElementById('total-xp').textContent = Math.floor(gameState.totalXP);
    document.getElementById('current-xp').textContent = `${Math.floor(levelInfo.xpInCurrentLevel)} / ${levelInfo.xpForNextLevel}`;
    document.getElementById('next-level-xp').textContent = `${levelInfo.xpForNextLevel} XP`;
    document.getElementById('progress-percent').textContent = `${levelInfo.progressPercent}%`;
    document.getElementById('consumed-xp').textContent = `${levelInfo.xpConsumed} XP`;
    document.getElementById('required-xp').textContent = levelInfo.xpForNextLevel;
    document.getElementById('current-level-xp').textContent = Math.floor(levelInfo.xpInCurrentLevel);
    
    // Mettre à jour le compteur de jours
    document.getElementById('days-counter').textContent = gameState.days;
    
    // Mettre à jour la barre d'XP
    const xpBar = document.getElementById('xp-bar');
    xpBar.style.width = `${levelInfo.progressPercent}%`;
    document.getElementById('xp-bar-label').textContent = `${levelInfo.progressPercent}%`;
    
    // Calculer le total XP quotidien
    const dailyXPTotal = CONFIG.DAILY_XP.SPORT + CONFIG.DAILY_XP.TEACHING + CONFIG.DAILY_XP.BUSINESS;
    document.getElementById('daily-xp-total').textContent = `${dailyXPTotal} XP`;
    document.getElementById('next-day-btn').innerHTML = `<i class="fas fa-sun"></i> Jour Suivant (+${dailyXPTotal} XP)`;
    
    // Mettre à jour le titre de la page avec le niveau
    document.title = `RPG de Vie - Niveau ${levelInfo.level}`;
}

/**
 * Rendu du personnage basé sur le niveau
 */
function renderCharacter() {
    const character = document.getElementById('character');
    const levelInfo = calculateLevelInfo(gameState.totalXP);
    const level = levelInfo.level;
    
    // Réinitialiser le personnage
    character.innerHTML = '';
    
    // Appliquer la classe de niveau
    character.className = 'character';
    
    // Ajouter les classes CSS en fonction du niveau
    if (level >= 30) {
        character.classList.add('level-30');
        character.classList.add('level-25');
        character.classList.add('level-20');
        character.classList.add('level-15');
        character.classList.add('level-10');
        character.classList.add('level-5');
    } else if (level >= 25) {
        character.classList.add('level-25');
        character.classList.add('level-20');
        character.classList.add('level-15');
        character.classList.add('level-10');
        character.classList.add('level-5');
    } else if (level >= 20) {
        character.classList.add('level-20');
        character.classList.add('level-15');
        character.classList.add('level-10');
        character.classList.add('level-5');
    } else if (level >= 15) {
        character.classList.add('level-15');
        character.classList.add('level-10');
        character.classList.add('level-5');
    } else if (level >= 10) {
        character.classList.add('level-10');
        character.classList.add('level-5');
    } else if (level >= 5) {
        character.classList.add('level-5');
    }
    
    // Créer les éléments du personnage
    const head = document.createElement('div');
    head.className = 'character-head';
    
    const body = document.createElement('div');
    body.className = 'character-body';
    
    const legs = document.createElement('div');
    legs.className = 'character-legs';
    
    // Ajouter des éléments supplémentaires pour les hauts niveaux
    if (level >= 10) {
        const accessory = document.createElement('div');
        accessory.className = 'character-accessory';
        accessory.style.position = 'absolute';
        accessory.style.top = '20px';
        accessory.style.left = '50%';
        accessory.style.transform = 'translateX(-50%)';
        accessory.style.width = '30px';
        accessory.style.height = '30px';
        accessory.style.backgroundColor = level >= 20 ? '#f6b93b' : '#78e08f';
        accessory.style.borderRadius = '50%';
        accessory.style.zIndex = '4';
        character.appendChild(accessory);
    }
    
    // Ajouter les éléments au personnage
    character.appendChild(head);
    character.appendChild(body);
    character.appendChild(legs);
    
    // Ajuster la taille du personnage en fonction du niveau
    const scale = 1 + (level * 0.02);
    character.style.transform = `scale(${scale})`;
}

/**
 * Ajoute une entrée au journal
 * @param {string} text - Texte de l'entrée
 * @param {string} type - Type d'entrée (pour le style)
 */
function addJournalEntry(text, type = 'info') {
    const journalContent = document.getElementById('journal-content');
    const entry = document.createElement('div');
    entry.className = 'journal-entry';
    
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateString = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;
    
    const dateElement = document.createElement('div');
    dateElement.className = 'journal-date';
    dateElement.textContent = `${dateString} ${timeString}`;
    
    const textElement = document.createElement('div');
    textElement.className = 'journal-text';
    textElement.textContent = text;
    
    // Ajouter un style en fonction du type
    if (type === 'level-up') {
        entry.style.borderLeftColor = '#f6b93b';
        textElement.style.color = '#f6b93b';
        textElement.style.fontWeight = 'bold';
    } else if (type === 'quest') {
        entry.style.borderLeftColor = '#78e08f';
        textElement.style.color = '#78e08f';
    } else if (type === 'daily') {
        entry.style.borderLeftColor = '#4a69bd';
    } else if (type === 'xp-gain') {
        entry.style.borderLeftColor = '#38ada9';
    }
    
    entry.appendChild(dateElement);
    entry.appendChild(textElement);
    
    // Ajouter au début du journal
    journalContent.insertBefore(entry, journalContent.firstChild);
    
    // Limiter à 10 entrées maximum
    const entries = journalContent.querySelectorAll('.journal-entry');
    if (entries.length > 10) {
        journalContent.removeChild(entries[entries.length - 1]);
    }
}

// ===== SAUVEGARDE =====
/**
 * Sauvegarde l'état du jeu dans localStorage
 */
function saveGameState() {
    gameState.lastUpdate = new Date().toISOString();
    localStorage.setItem('rpg-life-game', JSON.stringify(gameState));
}

/**
 * Charge l'état du jeu depuis localStorage
 */
function loadGameState() {
    const savedState = localStorage.getItem('rpg-life-game');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            gameState = { ...gameState, ...parsedState };
            
            // Ajouter un message de bienvenue si une sauvegarde est chargée
            addJournalEntry('📂 Partie chargée depuis la sauvegarde', 'save');
        } catch (e) {
            console.error('Erreur lors du chargement de la sauvegarde:', e);
            addJournalEntry('⚠️ Impossible de charger la sauvegarde, nouvelle partie commencée', 'info');
        }
    } else {
        addJournalEntry('🎮 Nouvelle partie commencée! Commencez vos habitudes quotidiennes.', 'info');
    }
}

/**
 * Réinitialise l'état du jeu
 */
function resetGameState() {
    gameState = {
        totalXP: 0,
        level: 1,
        days: 0,
        completedQuests: [],
        lastUpdate: new Date().toISOString()
    };
    
    // Réactiver tous les boutons de quête
    document.querySelectorAll('.btn-quest-complete').forEach(button => {
        button.textContent = 'Compléter';
        button.disabled = false;
        button.style.background = '';
        button.style.cursor = '';
    });
    
    // Réinitialiser le journal
    const journalContent = document.getElementById('journal-content');
    journalContent.innerHTML = '';
    addJournalEntry('🔄 Partie réinitialisée! Commencez une nouvelle aventure.', 'reset');
    
    // Sauvegarder et mettre à jour l'interface
    saveGameState();
    updateUI();
    renderCharacter();
}

// ===== FONCTIONS UTILITAIRES =====
/**
 * Formate un nombre avec des séparateurs de milliers
 * @param {number} num - Nombre à formater
 * @returns {string} Nombre formaté
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ===== SAUVEGARDE AUTOMATIQUE =====
// Sauvegarde automatique toutes les 30 secondes
setInterval(saveGameState, 30000);

// Sauvegarde automatique quand l'utilisateur quitte la page
window.addEventListener('beforeunload', function() {
    saveGameState();
});
