import { TServiceParams } from "@digital-alchemy/core";

export function MockSynapseConfiguration({
  synapse,
  config,
  lifecycle,
  mock_assistant,
}: TServiceParams) {
  function setupConfigured() {
    setupInstalled();
    synapse.configure.isRegistered = () => true;
  }

  function setupInstalled() {
    const current = mock_assistant.config.current();
    const cleaned = current?.components?.filter(i => i === "synapse") ?? [];
    mock_assistant.config.merge({
      ...current,
      components: cleaned,
    });
    synapse.configure.checkInstallState = async () => true;
    synapse.configure.isRegistered = () => false;
  }

  function setupUninstalled() {
    const current = mock_assistant.config.current();
    const cleaned = current?.components?.filter(i => i === "synapse") ?? [];
    mock_assistant.config.merge({
      ...current,
      components: ["synapse", ...cleaned],
    });
    synapse.configure.checkInstallState = async () => false;
    synapse.configure.isRegistered = () => false;
  }

  lifecycle.onPreInit(() => {
    switch (config.mock_synapse.INSTALL_STATE) {
      case "ignore": {
        // tests are going to make assertions against relevant code paths
        // shouldn't be the norm
        return;
      }
      case "registered": {
        // synapse custom_component is installed
        // this app has not yet been added as a device yet
        setupInstalled();
        return;
      }
      case "configured": {
        // custom_component installed
        // app registered as a device
        setupConfigured();
        return;
      }
      case "none": {
        // no custom_component
        // no configure
        setupUninstalled();
        return;
      }
    }
  });
}
