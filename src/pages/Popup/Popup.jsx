import React, { useEffect, useState } from 'react';
import React, { useEffect, useState, useLayoutEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

import './Fix';
import './Popup.css';
import RuleForm from './RuleForm';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import UpgradeNotice from './UpgradeNotice';
import { syncStorage } from '../Background/storageManager';

import debounce from 'lodash.debounce';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

const DARK_BLUE = '#282C34';
const TABSENSE_GREEN = '#12FA73';

const GlobalStyle = createGlobalStyle`
  html {
    background-color: #282C34;
  }

  body {
    width: 40rem;
    min-height: 20rem;
    height: 30rem;
    height: ${(props) => (props.$height ? `${props.$height}px` : '30rem')};
    color: white;
  }
`;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  #dynamic_form_item {
    width: 100%;
  }

  .ant-btn {
    cursor: pointer;
  }

  .MuiTab-textColorPrimary.Mui-selected {
    color: ${TABSENSE_GREEN};
  }

  .MuiTabs-indicator {
    background-color: ${TABSENSE_GREEN};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
`;

const initialRules = [
  {
    key: 0,
    name: 'mail',
    pattern: 'mail.google.com outlook.com https://mail.*',
    color: 'grey',
  },
  { key: 1, name: 'google', pattern: 'google.com', color: 'blue' },
  {
    key: 2,
    name: 'social',
    pattern: 'twitter.com instagram.com linkedin.com',
    color: 'yellow',
  },
  {
    key: 3,
    name: 'entertainment',
    pattern: 'reddit.com youtube.com pinterest.com',
    color: 'purple',
  },
  { key: 4, name: 'news', pattern: 'news.*', color: 'green' },
];

const rule = (key = 0, pattern = '', name = 'rule') => ({ key, pattern, name });
const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

const updateBackground = debounce(() => {
  chrome.runtime.sendMessage({ updated: true });
}, 250);

const collapseBackground = debounce((state) => {
  chrome.runtime.sendMessage({ collapse: state, expand: !state });
}, 100);

// Async call to wayscript program to log new user event
const logNewUserEvent = () => {
  const url = 'https://45845.wayscript.io?env=prod';
  fetch(url);
};

const Popup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [groupRules, setGroupRules] = useState([]);
  const [formKey, setFormKey] = useState('initial');
  const [value, setValue] = useState(0);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(null);

  // Dynamic height detection (minus 20px)
  useLayoutEffect(() => {
    const updateHeight = () => {
      if (window.innerHeight) {
        setBodyHeight(window.innerHeight - 20);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  }, []);

  const rerenderForm = () => {
    const rand = Math.floor(Math.random() * 1000);
    setFormKey(`form-${rand}`);
  };

  const saveGroupRules = async (rules, shouldRefresh = false) => {
    const rulesWithIds = rules.map((r) => {
      r.patterns = (r.pattern || '').split(/\s+/).filter((p) => p.length > 0);
      r.enabled = r.enabled !== false;
      if (r.id) return r;
      r.id = getRandomInt(100000);
      return r;
    });
    await syncStorage.set('groupRules', rulesWithIds);
    setGroupRules(rulesWithIds);
    updateBackground();
    if (shouldRefresh) rerenderForm();
  };

  const confirmInitial = async () => {
    syncStorage.set('hasConfirmed', true);
    logNewUserEvent();
    await saveGroupRules(initialRules, true);
    setTimeout(updateBackground(), 3000);
    setHasConfirmed(true);
  };

  const upgradeNeeded = !chrome.tabGroups;
  const renderMain = () => {
    if (upgradeNeeded) return <UpgradeNotice version />;
    if (isLoading) return '';
    switch (value) {
      case 0:
        return (
          <>
            <RuleForm
              key={formKey}
              groupRules={groupRules}
              saveGroupRules={saveGroupRules}
              handleCollapseGroups={collapseBackground}
              handleReload={updateBackground}
              showConfirm={!hasConfirmed}
              handleConfirm={confirmInitial}
            />
          </>
        );
      default:
        return null;
    }
  };
  // return null;

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Wrapper>
          <ContentWrapper>{renderMain()}</ContentWrapper>
        </Wrapper>
      </div>
    </ThemeProvider>
  );
};

export default Popup;