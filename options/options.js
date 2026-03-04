/**
 * Session Shepherd - Options Script
 * Handles saving and displaying configuration for automated background tasks.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const suspendThresholdInput = document.getElementById('suspend-threshold');
    const newRuleDomainInput = document.getElementById('new-rule-domain');
    const newRuleGroupInput = document.getElementById('new-rule-group');
    const addRuleBtn = document.getElementById('add-rule-btn');
    const rulesTableBody = document.getElementById('rules-table-body');
    const noRulesMessage = document.getElementById('no-rules-message');

    // Default configuration
    const defaultAutoGroupRules = [
        { domain: 'github.com', groupName: 'Development' },
        { domain: 'stackoverflow.com', groupName: 'Development' },
        { domain: 'jira.com', groupName: 'Work' },
        { domain: 'docs.google.com', groupName: 'Documents' }
    ];

    // Load initial settings
    loadSettings();

    // Event Listeners
    suspendThresholdInput.addEventListener('change', handleSuspendThresholdChange);
    addRuleBtn.addEventListener('click', handleAddRule);

    function loadSettings() {
        chrome.storage.local.get(['suspendThresholdMinutes', 'autoGroupRules'], (data) => {
            // Load Memory Saver Threshold
            if (data.suspendThresholdMinutes !== undefined) {
                suspendThresholdInput.value = data.suspendThresholdMinutes.toString();
            } else {
                suspendThresholdInput.value = "60"; // Default
            }

            // Load Auto-Group Rules
            let rules = data.autoGroupRules;
            if (!rules) {
                rules = defaultAutoGroupRules;
                chrome.storage.local.set({ autoGroupRules: rules });
            }
            renderRulesTable(rules);
        });
    }

    function handleSuspendThresholdChange(e) {
        const value = parseInt(e.target.value, 10);
        chrome.storage.local.set({ suspendThresholdMinutes: value }, () => {
            showSuccess(`Memory Saver threshold set to ${value === 0 ? 'Never' : value + ' minutes'}`);
        });
    }

    function handleAddRule() {
        const domain = newRuleDomainInput.value.trim().toLowerCase();
        const groupName = newRuleGroupInput.value.trim();

        if (!domain || !groupName) {
            showError('Both domain and group name are required.');
            return;
        }

        chrome.storage.local.get(['autoGroupRules'], (data) => {
            let rules = data.autoGroupRules || [];

            // Check for duplicates
            if (rules.some(r => r.domain === domain)) {
                showError('A rule for this domain already exists.');
                return;
            }

            rules.push({ domain, groupName });
            chrome.storage.local.set({ autoGroupRules: rules }, () => {
                newRuleDomainInput.value = '';
                newRuleGroupInput.value = '';
                renderRulesTable(rules);
                showSuccess('Rule added successfully.');
            });
        });
    }

    function handleDeleteRule(domainToRemove) {
        chrome.storage.local.get(['autoGroupRules'], (data) => {
            let rules = data.autoGroupRules || [];
            rules = rules.filter(r => r.domain !== domainToRemove);

            chrome.storage.local.set({ autoGroupRules: rules }, () => {
                renderRulesTable(rules);
                showSuccess('Rule deleted.');
            });
        });
    }

    function renderRulesTable(rules) {
        rulesTableBody.innerHTML = '';

        if (rules.length === 0) {
            rulesTableBody.closest('.rules-table').classList.add('hidden');
            noRulesMessage.classList.remove('hidden');
            return;
        }

        rulesTableBody.closest('.rules-table').classList.remove('hidden');
        noRulesMessage.classList.add('hidden');

        rules.forEach(rule => {
            const tr = document.createElement('tr');

            const tdDomain = document.createElement('td');
            tdDomain.textContent = rule.domain;

            const tdGroup = document.createElement('td');
            tdGroup.textContent = rule.groupName;

            const tdActions = document.createElement('td');
            tdActions.className = 'actions-col';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-rule-btn';
            deleteBtn.title = 'Delete Rule';
            deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
            deleteBtn.addEventListener('click', () => handleDeleteRule(rule.domain));

            tdActions.appendChild(deleteBtn);

            tr.appendChild(tdDomain);
            tr.appendChild(tdGroup);
            tr.appendChild(tdActions);

            rulesTableBody.appendChild(tr);
        });
    }
});
