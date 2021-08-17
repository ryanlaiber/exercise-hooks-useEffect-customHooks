import React, { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { getPostsBySubreddit } from '../services/redditAPI';

const Context = createContext();
const { Provider, Consumer } = Context;

const initialState = {
  postsBySubreddit: {
    frontend: {},
    reactjs: {},
  },
  selectedSubreddit: 'reactjs',
  shouldRefreshSubreddit: false,
  isFetching: false,
};

function RedditProvider({ children }) {
  
  const [state, setState] = useState(initialState);
  const {
    selectedSubreddit,
    postsBySubreddit,
    shouldRefreshSubreddit,
    isFetching,
  } = state;

  function handleFetchSuccess(json) {
    const lastUpdated = Date.now();
    const items = json.data.children.map((child) => child.data);

    const newState = {
      ...state,
      shouldRefreshSubreddit: false,
      isFetching: false,
    };

    newState.postsBySubreddit[state.selectedSubreddit] = {
      items,
      lastUpdated,
    };

    setState(newState);
  }

  function handleFetchError(error) {
    const newState = {
      ...state,
      shouldRefreshSubreddit: false,
      isFetching: false,
    };

    newState.postsBySubreddit[state.selectedSubreddit] = {
      error: error.message,
      items: [],
    };
    
    setState(newState);
  }

  function shouldFetchPosts() {
    
    const posts = postsBySubreddit[selectedSubreddit];

    if (!posts.items) return true;
    if (isFetching) return false;
    return shouldRefreshSubreddit;
  }
  
  function fetchPosts() {
    if (!shouldFetchPosts()) return;

    setState({
      ...state,
      shouldRefreshSubreddit: false,
      isFetching: true,
    });

    const { selectedSubreddit } = state;
    getPostsBySubreddit(selectedSubreddit)
      .then(handleFetchSuccess, handleFetchError);
  }

  useEffect(() => {
    const { shouldRefreshSubreddit } = state;
    if (shouldRefreshSubreddit) {
      fetchPosts();
    }
  },[selectedSubreddit, shouldRefreshSubreddit]);

  function handleSubredditChange(selectedSubreddit) {
    setState({ ...state, selectedSubreddit: selectedSubreddit, });
  }

  function handleRefreshSubreddit() {
    setState({ ...state, shouldRefreshSubreddit: true });
  }

  const context = {
    ...state,
    selectSubreddit: handleSubredditChange,
    fetchPosts: fetchPosts,
    refreshSubreddit: handleRefreshSubreddit,
    availableSubreddits: Object.keys(postsBySubreddit),
    posts: postsBySubreddit[selectedSubreddit].items,
  };

  return (
    <Provider value={context}>
      {children}
    </Provider>
  );
}

RedditProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { RedditProvider as Provider, Consumer, Context };