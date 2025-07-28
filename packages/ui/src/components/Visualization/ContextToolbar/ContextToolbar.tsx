import React from 'react';
import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { FunctionComponent, JSX, useContext } from 'react';
import { sourceSchemaConfig } from '../../../models/camel';
import { EntitiesContext } from '../../../providers/entities.provider';
import './ContextToolbar.scss';
import { FlowClipboard } from './FlowClipboard/FlowClipboard';
import { ExportDocument } from './ExportDocument/ExportDocument';
import { FlowExportImage } from './FlowExportImage/FlowExportImage';
import { FlowsMenu } from './Flows/FlowsMenu';
import { NewEntity } from './NewEntity/NewEntity';
import { RuntimeSelector } from './RuntimeSelector/RuntimeSelector';

export const ContextToolbar: FunctionComponent<{ additionalControls?: JSX.Element[] }> = ({ additionalControls }) => {
  const { currentSchemaType } = useContext(EntitiesContext)!;
  const isMultipleRoutes = sourceSchemaConfig.config[currentSchemaType].multipleRoute;

  const toolbarItems: JSX.Element[] = [
    <ToolbarItem key="toolbar-flows-list">
      <FlowsMenu />
    </ToolbarItem>,
  ];

  if (isMultipleRoutes) {
    toolbarItems.push(
      <ToolbarItem key="toolbar-new-route">
        <NewEntity />
      </ToolbarItem>,
    );
  }

  // Fixed items before runtime selector (clipboard, export buttons)
  const fixedItemsBeforeRuntimeSelector = [
    <ToolbarItem key="toolbar-clipboard">
      <FlowClipboard />
    </ToolbarItem>,
    <ToolbarItem key="toolbar-export-image">
      <FlowExportImage />
    </ToolbarItem>,
    <ToolbarItem key="toolbar-export-document">
      <ExportDocument />
    </ToolbarItem>,
  ];

  // The dropdown toolbar item (Camel Spring Boot) is RuntimeSelector
  const runtimeSelectorItem = <RuntimeSelector key="runtime-selector" />;

  // Insert your buttons **after** the runtime selector item
  // So toolbar order: flows list, new route (optional), clipboard/export buttons, runtime selector, YOUR BUTTONS

  // Start building final toolbar items array:
  let finalToolbarItems = [...toolbarItems];

  // Add fixed items (clipboard, export, etc)
  finalToolbarItems = finalToolbarItems.concat(fixedItemsBeforeRuntimeSelector);

  // Add the dropdown (runtime selector)
  finalToolbarItems.push(runtimeSelectorItem);

  // Add your buttons (additionalControls) after the dropdown
  if (additionalControls) {
    additionalControls.forEach((control, index) => {
      finalToolbarItems.push(React.cloneElement(control, { key: `additional-${index}` }));
    });
  }

  return (
    <Toolbar className="context-toolbar">
      <ToolbarContent>{finalToolbarItems}</ToolbarContent>
    </Toolbar>
  );
};
