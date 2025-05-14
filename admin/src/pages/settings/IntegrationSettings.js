import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { integrationService } from '../../services';
import Loading from '../../components/common/Loading';

/**
 * Integration Settings Component
 * 
 * Allows administrators to configure and manage third-party integrations
 * for the Nest platform including authentication providers, social networks,
 * and other Web3 services.
 */
const IntegrationSettings = () => {
  // State management
  const [integrations, setIntegrations] = useState([]);
  const [integrationTypes, setIntegrationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecret, setShowSecret] = useState({});
  const [isTesting, setIsTesting] = useState({});
  const [testStatus, setTestStatus] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [newIntegrationType, setNewIntegrationType] = useState('');
  const [newIntegrationData, setNewIntegrationData] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Integration categories
  const categories = {
    auth: 'Authentication Providers',
    social: 'Social Media',
    blockchain: 'Blockchain Services',
    payment: 'Payment Gateways',
    ai: 'AI Services',
    other: 'Other Services'
  };

  // Fetch integrations and available types on component mount
  useEffect(() => {
    const fetchIntegrationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both integrations and integration types in parallel
        const [integrationsResponse, typesResponse] = await Promise.all([
          integrationService.getIntegrations(),
          integrationService.getIntegrationTypes()
        ]);
        
        setIntegrations(integrationsResponse);
        setIntegrationTypes(typesResponse);
        
        // Initialize showSecret and isTesting states for each integration
        const secretState = {};
        const testingState = {};
        integrationsResponse.forEach(integration => {
          secretState[integration.id] = false;
          testingState[integration.id] = false;
        });
        setShowSecret(secretState);
        setIsTesting(testingState);
        
      } catch (err) {
        console.error('Error fetching integration data:', err);
        setError('Failed to load integration settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrationData();
  }, []);

  /**
   * Handles toggling the visibility of secret keys
   * 
   * @param {string} id - The integration ID
   */
  const handleToggleShowSecret = (id) => {
    setShowSecret(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  /**
   * Handles selecting an integration for editing
   * 
   * @param {Object} integration - The selected integration
   */
  const handleSelectIntegration = (integration) => {
    setSelectedIntegration(integration);
    setIsEditing(true);
  };

  /**
   * Handles canceling the edit mode
   */
  const handleCancelEdit = () => {
    setSelectedIntegration(null);
    setIsEditing(false);
  };

  /**
   * Handles saving integration changes
   */
  const handleSaveIntegration = async () => {
    try {
      setLoading(true);
      
      if (selectedIntegration.id) {
        // Update existing integration
        await integrationService.updateIntegration(selectedIntegration.id, selectedIntegration);
        
        // Update the integration in the state
        setIntegrations(prev => 
          prev.map(i => i.id === selectedIntegration.id ? selectedIntegration : i)
        );
        
        setSnackbar({
          open: true,
          message: 'Integration updated successfully',
          severity: 'success'
        });
      } else {
        // Add new integration
        const newIntegration = await integrationService.addIntegration(selectedIntegration);
        
        // Add the new integration to the state
        setIntegrations(prev => [...prev, newIntegration]);
        
        setSnackbar({
          open: true,
          message: 'Integration added successfully',
          severity: 'success'
        });
      }
      
      setSelectedIntegration(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving integration:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save integration. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles opening the add integration dialog
   */
  const handleOpenAddDialog = () => {
    setOpenDialog(true);
  };

  /**
   * Handles closing the add integration dialog
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewIntegrationType('');
    setNewIntegrationData({});
  };

  /**
   * Handles adding a new integration
   */
  const handleAddNewIntegration = () => {
    // Get the default configuration for the selected integration type
    const selectedType = integrationTypes.find(type => type.id === newIntegrationType);
    
    if (!selectedType) {
      setSnackbar({
        open: true,
        message: 'Please select an integration type',
        severity: 'warning'
      });
      return;
    }
    
    // Create a new integration with default values
    const newIntegration = {
      type: newIntegrationType,
      name: selectedType.name,
      enabled: false,
      config: {},
      category: selectedType.category || 'other'
    };
    
    setSelectedIntegration(newIntegration);
    setIsEditing(true);
    handleCloseDialog();
  };

  /**
   * Handles updating the selected integration fields
   * 
   * @param {string} field - The field name to update
   * @param {any} value - The new value
   */
  const handleUpdateIntegrationField = (field, value) => {
    setSelectedIntegration(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handles updating the selected integration config fields
   * 
   * @param {string} field - The config field name to update
   * @param {any} value - The new value
   */
  const handleUpdateConfigField = (field, value) => {
    setSelectedIntegration(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  /**
   * Handles testing the integration connection
   * 
   * @param {string} id - The integration ID
   */
  const handleTestIntegration = async (id) => {
    try {
      setIsTesting(prev => ({
        ...prev,
        [id]: true
      }));
      
      const result = await integrationService.testIntegration(id);
      
      setTestStatus(prev => ({
        ...prev,
        [id]: {
          success: result.success,
          message: result.message
        }
      }));
      
      // Show the test result for 5 seconds, then clear it
      setTimeout(() => {
        setTestStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[id];
          return newStatus;
        });
      }, 5000);
      
    } catch (err) {
      console.error(`Error testing integration ${id}:`, err);
      
      setTestStatus(prev => ({
        ...prev,
        [id]: {
          success: false,
          message: 'Failed to test integration'
        }
      }));
    } finally {
      setIsTesting(prev => ({
        ...prev,
        [id]: false
      }));
    }
  };

  /**
   * Handles deleting an integration
   * 
   * @param {string} id - The integration ID
   */
  const handleDeleteIntegration = async (id) => {
    if (!window.confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await integrationService.removeIntegration(id);
      
      // Remove the integration from the state
      setIntegrations(prev => prev.filter(i => i.id !== id));
      
      setSnackbar({
        open: true,
        message: 'Integration removed successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error(`Error deleting integration ${id}:`, err);
      setSnackbar({
        open: true,
        message: 'Failed to delete integration. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles syncing an integration
   * 
   * @param {string} id - The integration ID
   */
  const handleSyncIntegration = async (id) => {
    try {
      setLoading(true);
      
      await integrationService.syncIntegration(id);
      
      setSnackbar({
        open: true,
        message: 'Integration synced successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error(`Error syncing integration ${id}:`, err);
      setSnackbar({
        open: true,
        message: 'Failed to sync integration. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles OAuth authorization for an integration
   * 
   * @param {string} type - The integration type
   */
  const handleOAuthAuthorize = async (type) => {
    try {
      const url = await integrationService.getOAuthUrl(type);
      window.open(url, '_blank', 'width=600,height=600');
    } catch (err) {
      console.error(`Error getting OAuth URL for ${type}:`, err);
      setSnackbar({
        open: true,
        message: 'Failed to start OAuth flow. Please try again.',
        severity: 'error'
      });
    }
  };

  /**
   * Handles revoking OAuth access for an integration
   * 
   * @param {string} id - The integration ID
   */
  const handleRevokeOAuth = async (id) => {
    if (!window.confirm('Are you sure you want to revoke OAuth access? Users may need to reauthorize.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await integrationService.revokeOAuth(id);
      
      // Update the integration in the state
      const updatedIntegration = await integrationService.getIntegrationById(id);
      setIntegrations(prev => 
        prev.map(i => i.id === id ? updatedIntegration : i)
      );
      
      setSnackbar({
        open: true,
        message: 'OAuth access revoked successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error(`Error revoking OAuth for integration ${id}:`, err);
      setSnackbar({
        open: true,
        message: 'Failed to revoke OAuth access. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles closing the snackbar
   */
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Render loading state
  if (loading && !isEditing) {
    return <Loading />;
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Render the integration edit form
  if (isEditing && selectedIntegration) {
    // Get the integration type details
    const integrationType = integrationTypes.find(type => type.id === selectedIntegration.type);
    
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {selectedIntegration.id ? 'Edit Integration' : 'Add New Integration'}
        </Typography>
        
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Integration Name"
                  value={selectedIntegration.name || ''}
                  onChange={(e) => handleUpdateIntegrationField('name', e.target.value)}
                  disabled={loading}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedIntegration.category || 'other'}
                    onChange={(e) => handleUpdateIntegrationField('category', e.target.value)}
                    disabled={loading}
                  >
                    {Object.entries(categories).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedIntegration.enabled || false}
                      onChange={(e) => handleUpdateIntegrationField('enabled', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Enable Integration"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configuration
                </Typography>
                
                {/* Render dynamic config fields based on integration type */}
                {integrationType && integrationType.configFields && integrationType.configFields.map((field) => {
                  const configValue = selectedIntegration.config?.[field.name] || '';
                  const isSecret = field.type === 'secret';
                  
                  return (
                    <TextField
                      key={field.name}
                      fullWidth
                      label={field.label}
                      type={isSecret && !showSecret[field.name] ? 'password' : 'text'}
                      value={configValue}
                      onChange={(e) => handleUpdateConfigField(field.name, e.target.value)}
                      disabled={loading}
                      margin="normal"
                      helperText={field.description}
                      InputProps={isSecret ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleToggleShowSecret(field.name)}
                              edge="end"
                            >
                              {showSecret[field.name] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      } : undefined}
                    />
                  );
                })}
                
                {/* OAuth specific fields */}
                {integrationType && integrationType.authType === 'oauth' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      OAuth Configuration
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Redirect URI"
                          value={`${window.location.origin}/api/admin/integrations/oauth/${selectedIntegration.type}/callback`}
                          InputProps={{
                            readOnly: true,
                          }}
                          margin="normal"
                          helperText="Use this URL in your OAuth provider settings"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ mb: 2, mt: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveIntegration}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Integration'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Render the main integration settings page
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Integration Settings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          disabled={loading}
        >
          Add Integration
        </Button>
      </Box>
      
      {/* Group integrations by category */}
      {Object.entries(categories).map(([category, categoryLabel]) => {
        const categoryIntegrations = integrations.filter(integration => integration.category === category);
        
        if (categoryIntegrations.length === 0) {
          return null;
        }
        
        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {categoryLabel}
            </Typography>
            
            {categoryIntegrations.map((integration) => (
              <Accordion key={integration.id} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    width: '100%',
                    pr: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {integration.name}
                      </Typography>
                      <Chip 
                        label={integration.enabled ? 'Active' : 'Inactive'} 
                        color={integration.enabled ? 'success' : 'default'}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {integration.type}
                    </Typography>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {integration.description || 'No description available.'}
                      </Typography>
                    </Grid>
                    
                    {/* Status & Statistics */}
                    {integration.stats && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 1, mb: 2 }}>
                          {integration.stats.lastSynced && (
                            <Typography variant="body2" color="text.secondary">
                              Last synced: {new Date(integration.stats.lastSynced).toLocaleString()}
                            </Typography>
                          )}
                          {integration.stats.usageCount !== undefined && (
                            <Typography variant="body2" color="text.secondary">
                              Usage count: {integration.stats.usageCount}
                            </Typography>
                          )}
                          {integration.stats.connectedUsers !== undefined && (
                            <Typography variant="body2" color="text.secondary">
                              Connected users: {integration.stats.connectedUsers}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                    
                    {/* Test status */}
                    {testStatus[integration.id] && (
                      <Grid item xs={12}>
                        <Alert 
                          severity={testStatus[integration.id].success ? 'success' : 'error'}
                          sx={{ mb: 2 }}
                        >
                          {testStatus[integration.id].message}
                        </Alert>
                      </Grid>
                    )}
                    
                    {/* Action buttons */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<SettingsIcon />}
                          onClick={() => handleSelectIntegration(integration)}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="info"
                          startIcon={isTesting[integration.id] ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                          onClick={() => handleTestIntegration(integration.id)}
                          disabled={isTesting[integration.id] || !integration.enabled}
                        >
                          Test Connection
                        </Button>
                        
                        {integration.oauthConnected && (
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => handleRevokeOAuth(integration.id)}
                          >
                            Revoke OAuth
                          </Button>
                        )}
                        
                        <Button
                          variant="outlined"
                          color="success"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleSyncIntegration(integration.id)}
                          disabled={!integration.enabled}
                        >
                          Sync
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteIntegration(integration.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        );
      })}
      
      {/* No integrations message */}
      {integrations.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No integrations configured yet. Click "Add Integration" to get started.
        </Alert>
      )}
      
      {/* Add Integration Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Integration</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Integration Type</InputLabel>
            <Select
              value={newIntegrationType}
              onChange={(e) => setNewIntegrationType(e.target.value)}
            >
              {integrationTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {newIntegrationType && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {integrationTypes.find(t => t.id === newIntegrationType)?.description || ''}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddNewIntegration} 
            variant="contained" 
            color="primary"
            disabled={!newIntegrationType}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IntegrationSettings;
