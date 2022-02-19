/* eslint-disable max-nested-callbacks */
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

import React from 'react';
import { mount } from 'enzyme';

import { PUSH, REPLACE } from '../../src/types';
import {
  Link as LinkComponent,
  PersistentQueryLink as PersistentQueryLinkComponent
} from '../../src/components/link';
import {
  ImmutableLink,
  ImmutablePersistentQueryLink
} from '../../src/immutable/components/link';

import { captureErrors, fakeStore, standardClickEvent } from '../test-util';
import { Provider } from 'react-redux';

chai.use(sinonChai);

const linkTest = {
  Link: LinkComponent,
  immutable: false,
  testLabel: 'Link'
};
const immutableLinkTest = {
  Link: ImmutableLink,
  immutable: true,
  testLabel: 'ImmutableLink'
};

[linkTest, immutableLinkTest].forEach(({ Link, immutable, testLabel }) => {
  describe(`${testLabel}`, () => {
    describe('PUSH', () => {
      const hrefs = [
        '/home/messages/a-team?test=ing',
        {
          pathname: '/home/messages/a-team?test=ing',
          query: {
            test: 'ing'
          }
        }
      ];

      hrefs.forEach(href => {
        it('dispatches a PUSH action with the correct href when clicked', done => {
          const assertion = action => {
            if (action.type === PUSH) {
              const { payload } = action;
              captureErrors(done, () => {
                expect(payload)
                  .to.have.property('pathname')
                  .that.contains('/home/messages/a-team');

                if (typeof href === 'string') {
                  expect(payload)
                    .to.have.property('search')
                    .that.equal('?test=ing');
                } else {
                  expect(payload)
                    .to.have.property('query')
                    .that.deep.equals({ test: 'ing' });
                }
              });
            }
          };

          const store = fakeStore({ assertion, immutable });
          const wrapper = mount(
            <Provider store={store}>
              <Link href={href} />
            </Provider>
          );

          wrapper.find('a').simulate('click', standardClickEvent);
        });

        it('dispatches a PUSH action with the persistQuery option', done => {
          const assertion = action => {
            if (action.type === PUSH) {
              const { payload } = action;
              captureErrors(done, () => {
                expect(payload).to.have.nested.property(
                  'options.persistQuery',
                  true
                );
              });
            }
          };

          const store = fakeStore({ immutable, assertion });
          const wrapper = mount(
            <Provider store={store}>
              <Link href={href} persistQuery />
            </Provider>
          );

          wrapper.find('a').simulate('click', standardClickEvent);
        });
      });
    });

    describe('REPLACE', () => {
      const hrefs = [
        '/home/messages/a-team?test=ing',
        {
          pathname: '/home/messages/a-team?test=ing',
          query: {
            test: 'ing'
          }
        }
      ];

      hrefs.forEach(href => {
        it('dispatches a REPLACE action with the correct href when clicked', done => {
          const assertion = action => {
            if (action.type === REPLACE) {
              const { payload } = action;
              captureErrors(done, () => {
                expect(payload)
                  .to.have.property('pathname')
                  .that.contains('/home/messages/a-team');

                if (typeof href === 'string') {
                  expect(payload)
                    .to.have.property('search')
                    .that.equal('?test=ing');
                } else {
                  expect(payload)
                    .to.have.deep.property('query')
                    .that.deep.equals({ test: 'ing' });
                }
              });
            }
          };

          const store = fakeStore({ immutable, assertion });
          const wrapper = mount(
            <Provider store={store}>
              <Link replaceState href={href} />
            </Provider>
          );

          wrapper.find('a').simulate('click', standardClickEvent);
        });
      });
    });

    describe('Accessibility', () => {
      ['shiftKey', 'altKey', 'metaKey', 'ctrlKey'].forEach(modifierKey =>
        it(`uses default browser behavior when the user holds the ${modifierKey}`, () => {
          const store = fakeStore({ immutable });
          const wrapper = mount(
            <Provider store={store}>
              <Link href="/home/things" />
            </Provider>
          );

          const spy = sandbox.spy();
          wrapper.find('a').simulate('click', {
            ...standardClickEvent,
            [modifierKey]: true,
            preventDefault: spy
          });

          expect(spy).to.not.have.been.called;
        })
      );

      it('uses default browser behavior when the user clicks a non-left mouse button', () => {
        const store = fakeStore({ immutable });
        const wrapper = mount(
          <Provider store={store}>
            <Link href="/home/things" />
          </Provider>
        );

        const spy = sandbox.spy();
        wrapper.find('a').simulate('click', {
          ...standardClickEvent,
          button: 1,
          preventDefault: spy
        });

        expect(spy).to.not.have.been.called;
      });

      it('prevents default when the user left-clicks', () => {
        const store = fakeStore({ immutable });
        const wrapper = mount(
          <Provider store={store}>
            <Link href="/home/things" />
          </Provider>
        );

        const spy = sandbox.spy();
        wrapper.find('a').simulate('click', {
          ...standardClickEvent,
          button: 0,
          preventDefault: spy
        });

        expect(spy).to.have.been.calledOnce;
      });

      it('passes through DOM props, including aria attributes', () => {
        const store = fakeStore({ immutable });
        const wrapper = mount(
          <Provider store={store}>
            <Link
              href="/home/things"
              aria-label="a11y"
              className="classy"
              style={{
                fontFamily: 'Comic Sans'
              }}
            />
          </Provider>
        );

        const props = wrapper.childAt(0).props();
        expect(props).to.have.property('aria-label', 'a11y');
        expect(props).to.have.property('className', 'classy');
        expect(props)
          .to.have.property('style')
          .that.deep.equals({
            fontFamily: 'Comic Sans'
          });
      });

      it('calls the onClick prop if provided', () => {
        const onClick = sandbox.stub();
        const store = fakeStore({ immutable });
        const wrapper = mount(
          <Provider store={store}>
            <Link href="/home/things" onClick={onClick} />
          </Provider>
        );

        wrapper.find('a').simulate('click', standardClickEvent);

        expect(onClick).to.have.been.calledOnce;
      });
    });

    describe('Rendering', () => {
      it('renders an <a /> with the correct href attribute', () => {
        const hrefs = ['/path', '/path?key=value', 'path/with/nested/routes'];
        hrefs.forEach(href => {
          const store = fakeStore({ immutable });
          const wrapper = mount(
            <Provider store={store}>
              <Link href={href} />
            </Provider>
          );
          expect(wrapper.find('a').prop('href')).to.equal(href);
        });
      });

      it('renders an <a /> with the correct href attribute using a basename', () => {
        const hrefs = ['/path', '/path?key=value', 'path/with/nested/routes'];
        hrefs.forEach(href => {
          const store = fakeStore({ immutable, basename: '/base' });
          const wrapper = mount(
            <Provider store={store}>
              <Link href={href} />
            </Provider>
          );
          expect(wrapper.find('a').prop('href')).to.equal(`/base${href}`);
        });
      });

      it('parses and renders location objects as hrefs', () => {
        const expected = [
          '/path',
          '/path?key=value',
          '/path?please=clap',
          'path/with/nested/routes'
        ];
        const locations = [
          { pathname: '/path' },
          { pathname: '/path', query: { key: 'value' } },
          { pathname: '/path', search: '?please=clap' },
          { pathname: 'path/with/nested/routes' }
        ];
        locations.forEach((location, index) => {
          const store = fakeStore({ immutable });
          const wrapper = mount(
            <Provider store={store}>
              <Link href={location} />
            </Provider>
          );
          expect(wrapper.find('a').prop('href')).to.equal(expected[index]);
        });
      });

      it('parses and renders location objects as hrefs using a basename', () => {
        const expected = [
          '/path',
          '/path?key=value',
          '/path?please=clap',
          'path/with/nested/routes'
        ];
        const locations = [
          { pathname: '/path' },
          { pathname: '/path', query: { key: 'value' } },
          { pathname: '/path', search: '?please=clap' },
          { pathname: 'path/with/nested/routes' }
        ];
        locations.forEach((location, index) => {
          const store = fakeStore({ immutable, basename: '/base' });
          const wrapper = mount(
            <Provider store={store}>
              <Link href={location} />
            </Provider>
          );
          expect(wrapper.find('a').prop('href')).to.equal(
            `/base${expected[index]}`
          );
        });
      });

      it('renders the correct href when persisting queries', () => {
        const onClick = sandbox.stub();
        const store = fakeStore({ immutable, query: { persist: 'pls' } });
        const wrapper = mount(
          <Provider store={store}>
            <Link persistQuery href="/home?what=do" onClick={onClick} />
          </Provider>
        );

        expect(wrapper.find('a').prop('href')).to.equal(
          '/home?persist=pls&what=do'
        );
      });

      it('renders activeProps when the href pathname matches the current pathname', () => {
        const store = fakeStore({ immutable, pathname: '/mr-jackpots' });
        const wrapper = mount(
          <Provider store={store}>
            <Link
              href="/mr-jackpots"
              activeProps={{
                style: { color: 'red' }
              }}
            />
          </Provider>
        );

        expect(wrapper.find('a').prop('style')).to.have.property(
          'color',
          'red'
        );
      });

      it('renders without activeProps when href and location pathname do not match', () => {
        const store = fakeStore({ immutable, pathname: '/mr-jackpots' });
        const wrapper = mount(
          <Provider store={store}>
            <Link
              href="/hello-oo-ooooooooo"
              activeProps={{
                style: { color: 'red' }
              }}
            />
          </Provider>
        );

        expect(wrapper.find('a').prop('style')).to.be.undefined;
      });
    });
  });
});

const persistentQueryLinkTest = {
  PersistentQueryLink: PersistentQueryLinkComponent,
  immutable: false,
  testLabel: 'PersistentQueryLink'
};
const immutablePersistentQueryLinkTest = {
  PersistentQueryLink: ImmutablePersistentQueryLink,
  immutable: true,
  testLabel: 'ImmutablePersistentQueryLink'
};

[persistentQueryLinkTest, immutablePersistentQueryLinkTest].forEach(
  ({ PersistentQueryLink, immutable, testLabel }) => {
    describe(`${testLabel}`, () => {
      it('appends persistQuery to the props', () => {
        const store = fakeStore({ immutable });
        const wrapper = mount(
          <Provider store={store}>
            <PersistentQueryLink href="/" />
          </Provider>
        );
        const link = wrapper.findWhere(node => node.name() === 'LinkComponent');

        expect(link.props()).to.have.property('persistQuery', true);
      });
    });
  }
);
