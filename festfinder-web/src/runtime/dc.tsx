'use client';
/**
 * Runs a design screen's logic class inside React.
 *
 * Each screen's logic is `class Component extends DCLogic` with `state`, `setState`,
 * lifecycle methods and a `renderVals()` that returns everything its template reads. The
 * design runtime hosted that class in a wrapper component; this is the same wrapper, so
 * the logic behaves exactly as it did — state merges the same way, lifecycle hooks fire
 * at the same moments, and a failing renderVals() shows the same error banner.
 */
import { Component, type ComponentType } from 'react';

type Props = Record<string, any>;
type State = Record<string, any>;
type Update = State | ((prev: State) => State);

interface Host {
  setLogicState(update: Update, cb?: () => void): void;
  forceUpdate(): void;
}

/** The base class the screens' logic extends. */
export class DCLogic {
  props: Props;
  state: State = {};
  __host?: Host;

  constructor(props: Props) {
    this.props = props || {};
  }

  setState(update: Update, cb?: () => void) {
    if (this.__host) this.__host.setLogicState(update, cb);
  }

  forceUpdate() {
    if (this.__host) this.__host.forceUpdate();
  }

  componentDidMount() {}
  componentDidUpdate(_prevProps: Props) {}
  componentWillUnmount() {}

  /** The flat object the template renders against (merged over props). */
  renderVals(): Record<string, any> {
    return {};
  }
}

export type LogicClass = new (props: Props) => DCLogic;

interface HostProps {
  name: string;
  Logic: LogicClass;
  View: ComponentType<{ s: Record<string, any> }>;
  props: Props;
}

export class DCHost extends Component<HostProps, { v: number }> implements Host {
  private logic: DCLogic;
  private ctorError: string | null = null;
  state = { v: 0 };

  constructor(p: HostProps) {
    super(p);
    try {
      this.logic = new p.Logic(p.props);
    } catch (e) {
      console.error(e);
      this.ctorError = p.name + ': ' + (e instanceof Error && e.message ? e.message : String(e));
      this.logic = new DCLogic(p.props);
    }
    this.logic.__host = this;
  }

  setLogicState(update: Update, cb?: () => void) {
    const prev = this.logic.state;
    const patch = typeof update === 'function' ? update(prev) : update;
    this.logic.state = { ...prev, ...patch };
    this.setState((s) => ({ v: s.v + 1 }), cb);
  }

  componentDidMount() {
    try {
      this.logic.componentDidMount();
    } catch (e) {
      console.error(e);
    }
  }

  componentDidUpdate(prev: HostProps) {
    this.logic.props = this.props.props;
    try {
      this.logic.componentDidUpdate(prev.props);
    } catch (e) {
      console.error(e);
    }
  }

  componentWillUnmount() {
    try {
      this.logic.componentWillUnmount();
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const { name, View, props } = this.props;
    this.logic.props = props;
    let vals: Record<string, any> = props;
    let err = this.ctorError;
    try {
      vals = { ...props, ...(this.logic.renderVals() || {}) };
    } catch (e) {
      console.error(e);
      err = name + '.renderVals(): ' + (e instanceof Error && e.message ? e.message : String(e));
    }
    return (
      <div className={'sc-host' + (err ? ' sc-has-error' : '')} data-sc-name={name}>
        {err ? <div className="sc-logic-error">{err}</div> : null}
        <View s={vals} />
      </div>
    );
  }
}
