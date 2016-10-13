import * as React from 'react';
import { observer } from 'mobx-react';
import * as R from 'ramda';
import * as invariant from 'invariant';

import { IMobxForms } from "./mobxForm";

import { ARRAY_IGNORE_PROPS } from './utils/consts';
import contextShape from './utils/contextShape';


interface IProps {
  name: string;
  component: React.ComponentClass<any> | React.StatelessComponent<any>;
  // defaulted:
  flat?: boolean;
  // optional:
  index?: number | undefined;
}

interface IFields {
  map: Function;
  push: Function;
  pop: Function;
  unshift: Function;
  shift: Function;
}

@observer
export default class FieldArray extends React.Component<IProps, void> {
  static defaultProps = {
    flat: false,
  };

  static contextTypes = {
    mobxForms: React.PropTypes.shape(contextShape).isRequired,
  };

  static childContextTypes = {
    mobxForms: React.PropTypes.shape(contextShape).isRequired,
  };

  context: IMobxForms;

  position: string;
  location: string;
  fields: IFields;

  getChildContext() {
    const { name, index, flat } = this.props;
    const { form, context } = this.context.mobxForms;

    return {
      mobxForms: {
        form,
        context: this.validIndex ? `${context}#${index}.${name}` : name,
        flatArray: flat,
      },
    };
  }

  componentWillMount() {
    const { name, index } = this.props;

    invariant(
      this.context.mobxForms,
      '[mobx-forms] FieldArray must be in a component decorated with "mobxForm"'
    );

    const { form, context, flatArray } = this.context.mobxForms;

    if (context === '') {
      invariant(
        !this.validIndex,
        '[mobx-forms] "index" can only be passed to components inside ArrayField'
      );
    } else {
      invariant(
        this.validIndex,
        '[mobx-forms] "index" must be passed to ArrayField components'
      );
    }

    this.position = this.validIndex ? `${context}#${index}` : '';
    this.location = this.validIndex ? `${context}#${index}.${name}` : name;
    this.fields = {
      map: (fn: (index: number) => any) => form.map(this.location, fn),
      push: () => form.push(this.location),
      pop: () => form.pop(this.location),
      unshift: () => form.unshift(this.location),
      shift: () => form.shift(this.location),
    };

    invariant(
      !flatArray,
      '[mobx-forms] FieldArray cannot be located within a flat FieldArray'
    );

    form.addFieldArray(this.position, name);
  }

  componentWillUnmount() {
    const { name } = this.props;
    const { form } = this.context.mobxForms;

    form.removeField(this.position, name);
  }

  get validIndex() {
    const { index } = this.props;

    return typeof index === 'number';
  }

  render() {
    const { component } = this.props;

    const rest = R.omit(ARRAY_IGNORE_PROPS, this.props);

    return React.createElement(component, R.merge(rest, {
      fields: this.fields,
    }));
  }
}
