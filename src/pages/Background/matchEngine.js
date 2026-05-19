export const matchRuleShort = (pattern) => {
    // Escape special characters but preserve our intended syntax marks
    const isDomainOnly = pattern.includes('.') && !pattern.includes('/') && !pattern.includes('*');
    const isExactWildcard = pattern.includes('*');
    const isUrlPath = pattern.includes('/');

    // Always case-insensitive internally
    let regexStr = pattern.toLowerCase();
    // Escape regex control characters except * and .
    regexStr = regexStr.replace(/([+?^=!:${}()|\[\]\\/])/g, "\\$1");

    // Rule definitions based on spec:
    // If pattern contains / -> treat as URL
    // If pattern contains * -> treat as wildcard
    // If pattern contains . but no / -> treat as domain
    // If pattern contains no dots -> match against any part of the URL
    // If pattern is surrounded by quotes -> match against the page title

    if (regexStr.startsWith('"') && regexStr.endsWith('"')) {
        // This handles title match. Let caller handle distinguishing URL from title
        return new RegExp(regexStr.replace(/"/g, ''), 'i');
    }

    if (isExactWildcard) {
        regexStr = regexStr.replace(/\./g, '\\.');
        regexStr = regexStr.replace(/\*/g, '.*');
    } else if (isUrlPath) {
        regexStr = regexStr.replace(/\./g, '\\.');
    } else if (isDomainOnly) {
        regexStr = regexStr.replace(/\./g, '\\.');
    }

    return new RegExp(regexStr, 'i');
}

export const checkForRuleMatch = (tab, rules) => {
    for (const rule of rules) {
        const patterns = rule.patterns || (rule.pattern ? rule.pattern.split(/\s+/) : []);

        for (const pattern of patterns) {
            if (!pattern) continue;

            const isTitleMatch = pattern.startsWith('"') && pattern.endsWith('"');
            const regex = matchRuleShort(pattern);

            if (isTitleMatch) {
                if (tab.title && tab.title.toLowerCase().match(regex)) {
                    return rule;
                }
            } else {
                if (tab.url && tab.url.toLowerCase().match(regex)) {
                    return rule;
                }
            }
        }
    }
    return null;
}
