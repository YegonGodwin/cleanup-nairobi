import React from 'react';
import Dashboard from './Dashboard';

export default {
  title: 'Components/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
};

const Template = (args) => <Dashboard {...args} />;

export const GreenThemeDashboard = Template.bind({});
GreenThemeDashboard.args = {};