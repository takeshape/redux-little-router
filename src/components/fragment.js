// @flow
/* eslint-disable react/sort-comp, max-statements */
import type { Node } from 'react';
import type { MapStateToProps } from 'react-redux';
import type { Location } from '../types';

import UrlPattern from 'url-pattern';
import React, { Children, useMemo, useContext, useState } from 'react';
import { connect } from 'react-redux';
import { MatchCache } from '../util/match-cache';
import generateId from '../util/generate-id';

const resolveChildRoute = (parentRoute, currentRoute) => {
  const parentIsRootRoute =
    parentRoute && parentRoute !== '/' && parentRoute !== currentRoute;

  return parentIsRootRoute
    ? `${parentRoute}${currentRoute || ''}`
    : currentRoute;
};

const resolveCurrentRoute = (parentRoute, currentRoute) => {
  if (!currentRoute) {
    return null;
  }

  // First route will always be a wildcard
  if (!parentRoute) {
    return `${currentRoute}*`;
  }

  const currentIsRootRoute = currentRoute === '/';
  const parentIsRootRoute = parentRoute === '/';

  // Only prefix non-root parent routes
  const routePrefix = (!parentIsRootRoute && parentRoute) || '';

  // Support "index" routes:
  // <Fragment forRoute='/home'>
  //   <Fragment forRoute='/'>
  //   </Fragment>
  // </Fragment>
  const routeSuffix =
    currentIsRootRoute && !parentIsRootRoute ? '' : currentRoute;

  const wildcard = currentIsRootRoute && parentIsRootRoute ? '' : '*';

  return `${routePrefix}${routeSuffix}${wildcard}`;
};

const shouldShowFragment = ({
  forRoute,
  withConditions,
  matcher,
  location
}) => {
  if (!forRoute) {
    return withConditions && withConditions(location);
  }

  const matchesRoute = matcher && matcher.match(location.pathname);

  return withConditions
    ? matchesRoute && withConditions(location)
    : matchesRoute;
};

type Props = {
  location: Location,
  matchRoute: Function,
  matchWildcardRoute: Function,
  forRoute?: string,
  withConditions?: (location: Location) => boolean,
  forNoMatch?: boolean,
  children: Node
};

const FragmentContext = React.createContext({});

const counter = {};

export const FragmentComponent: React$StatelessFunctionalComponent<
  Props
> = props => {
  const { children, forRoute, withConditions, forNoMatch, location } = props;
  const [id] = useState(() => generateId());
  const { parentId, parentRoute, matchCache = new MatchCache() } = useContext(
    FragmentContext
  );
  const currentRoute = resolveCurrentRoute(parentRoute, forRoute);
  const matcher = useMemo(
    () => (currentRoute && new UrlPattern(currentRoute)) || null,
    [currentRoute]
  );

  counter[id] = counter[id] === undefined ? 1 : counter[id] + 1;

  const shouldShow = shouldShowFragment({
    forRoute,
    withConditions,
    matcher,
    location
  });

  if (!shouldShow && !forNoMatch) {
    return null;
  }

  if (parentId) {
    const previousMatch = matchCache.get(parentId);
    if (previousMatch && previousMatch !== currentRoute) {
      return null;
    } else {
      matchCache.add(parentId, currentRoute);
    }
  }

  const contextValue = {
    parentRoute: resolveChildRoute(parentRoute, forRoute),
    parentId: id,
    matchCache
  };
  return (
    <FragmentContext.Provider value={contextValue}>
      {Children.only(children)}
    </FragmentContext.Provider>
  );
};

const mapStateToProps: MapStateToProps<*, *, *> = state => ({
  location: state.router
});

export default connect(mapStateToProps)(FragmentComponent);
