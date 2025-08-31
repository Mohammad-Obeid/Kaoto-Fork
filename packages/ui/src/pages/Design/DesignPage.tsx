import { FunctionComponent, JSX, ReactNode, useContext, useState } from 'react';
import { Visualization } from '../../components/Visualization';
import { CatalogModalProvider } from '../../providers/catalog-modal.provider';
import { ActionConfirmationModalContextProvider } from '../../providers/action-confirmation-modal.provider';
import { EntitiesContext } from '../../providers/entities.provider';
import { Button, AlertVariant, Modal, ModalVariant } from '@patternfly/react-core';
import { PlayIcon, CheckIcon, UploadIcon } from '@patternfly/react-icons';
import './DesignPage.scss';
import { SourceCodeContext } from '../../providers/source-code.provider';
import { TokenContext } from '../../providers/source-code.provider';

const BASE_URL = 'http://localhost:8081';

export const DesignPage: FunctionComponent<{ fallback?: ReactNode; additionalToolbarControls?: JSX.Element[] }> = (
  props,
) => {
  const entitiesContext = useContext(EntitiesContext);
  const visualEntities = entitiesContext?.visualEntities ?? [];

  // Get YAML from SourceCodeContext
  const yamlContent = useContext(SourceCodeContext) ?? '';
  const token = useContext(TokenContext);

  // Modal state for API feedback
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalVariant, setModalVariant] = useState<AlertVariant>('success');
  const [modalTitle, setModalTitle] = useState<string>('');

  // Modal state for confirmation before upload
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showModal = (title: string, message: string, variant: AlertVariant) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant(variant);
  };

  // Called when user confirms upload in confirmation modal
  const confirmUpload = async () => {
    setConfirmOpen(false);
    try {
      const response = await fetch(`${BASE_URL}/routes/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', Authorization: `Bearer ${token}` }, // raw YAML text
        body: yamlContent,
      });
      const text = await response.text();
      if (response.ok) {
        showModal('Upload success', text, 'success');
      } else {
        showModal('Upload failed', text, 'danger');
      }
    } catch (error) {
      showModal('Upload error', `${error}`, 'danger');
    }
  };

  // Open confirmation modal instead of direct upload
  const handleUpload = () => {
    setConfirmOpen(true);
  };

  const handleTest = async () => {
    try {
      const requestBody = {
        yamlContent,
        testMessage: 'Sample test message',
      };
      const response = await fetch(`${BASE_URL}/routes/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (response.ok) {
        showModal('Test success', JSON.stringify(data, null, 2), 'success');
      } else {
        showModal('Test failed', JSON.stringify(data, null, 2), 'danger');
      }
    } catch (error) {
      showModal('Test error', `${error}`, 'danger');
    }
  };

  const handleValidate = async () => {
    try {
      const requestBody = {
        yamlContent,
      };
      const response = await fetch(`${BASE_URL}/routes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (response.ok) {
        showModal('Validation success', 'YAML is valid.', 'success');
      } else {
        showModal('Validation failed', JSON.stringify(data, null, 2), 'danger');
      }
    } catch (error) {
      showModal('Validation error', `${error}`, 'danger');
    }
  };

  const myButtons = [
    <Button key="test" variant="danger" onClick={handleTest} style={{ marginLeft: 8 }} icon={<PlayIcon />}>
      Test
    </Button>,
    <Button key="validate" variant="danger" onClick={handleValidate} style={{ marginLeft: 8 }} icon={<CheckIcon />}>
      Validate
    </Button>,
    <Button key="upload" variant="danger" onClick={handleUpload} style={{ marginLeft: 8 }} icon={<UploadIcon />}>
      Upload
    </Button>,
  ];

  return (
    <CatalogModalProvider>
      <ActionConfirmationModalContextProvider>
        {/* Confirmation Modal before upload */}
        <Modal
          variant={ModalVariant.small}
          title="Confirm Upload"
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          aria-label="Confirm upload modal"
          showClose={true}
          hasNoBodyWrapper={false}
        >
          <div style={{ padding: '1rem 2rem', textAlign: 'center' }}>Are you sure you want to upload the route?</div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              paddingBottom: '1rem',
              paddingTop: 8,
            }}
          >
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmUpload}>
              Confirm
            </Button>
          </div>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          variant={ModalVariant.small}
          title={modalTitle}
          isOpen={modalMessage !== null}
          onClose={() => setModalMessage(null)}
          aria-label="API feedback modal"
          showClose={true}
          style={{
            borderRadius: 12,
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <div
            style={{
              padding: '1.5rem 2rem',
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: 16,
              lineHeight: 1.5,
              color:
                modalVariant === 'success'
                  ? '#2e7d32' // green
                  : modalVariant === 'danger'
                    ? '#d32f2f' // red
                    : '#555',
              fontWeight: 600,
              userSelect: 'text',
              minWidth: 320,
              maxWidth: 420,
              margin: '0 auto',
            }}
          >
            {modalMessage}
          </div>
        </Modal>

        <Visualization
          className="canvas-page"
          entities={visualEntities}
          fallback={props.fallback}
          additionalToolbarControls={myButtons}
        />
      </ActionConfirmationModalContextProvider>
    </CatalogModalProvider>
  );
};
