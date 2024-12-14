import tw from 'twin.macro';
import React, { useState } from 'react';
import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import Modal from '@/components/elements/Modal';
import { Dialog } from '@/components/elements/dialog';
import { useStoreActions, Actions } from 'easy-peasy';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Mod, installMod } from '@/api/server/mcmods/getMods';
import { faList, faCloudDownloadAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import ModsVersionContainer from '@/components/server/mcmods/ModsVersionContainer';

const ModsCard: React.FC<{ mod: Mod }> = ({ mod }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const [expanded, setExpanded] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [externalDownload, setExternalDownload] = useState(false);
    const [externalUrl, setExternalUrl] = useState(false);

    const handleinstallMod = async (category: string, modId: number | string, modName: string) => {
        clearFlashes('mcmods:install');
        try {
            await installMod(uuid, category, modId);
            addFlash({
                type: 'success',
                key: 'mcmods:install',
                message: `The mod '${modName}' has been successfully installed in your Mods folder.`,
            });
        } catch (error) {
            addFlash({
                type: 'error',
                key: 'mcmods:install',
                title: 'Error',
                message: `We were not able to install the mod '${modName}'. However, you can still download this mod from its official website.`,
            });
        }
    };

    const modCategory = (() => {
        if (mod.category === 'modrinth') {
            return 'Modrinth';
        }
        if (mod.category === 'curseforge') {
            return 'CurseForge';
        }
        return mod.category;
    })();

    return (
        <div css={tw`bg-neutral-700 rounded-lg p-4 flex flex-col h-full`}>
            <div css={tw`flex items-start mb-2`}>
                <div css={tw`w-12 h-12 mr-4 rounded bg-neutral-600 flex items-center justify-center overflow-hidden flex-shrink-0`}>
                    <img src={mod.icon} alt={mod.name} css={tw`w-10 h-10 object-cover`} />
                </div>
                <div css={tw`flex-grow`}>
                    <h3 css={tw`text-lg font-normal`}>{mod.name}</h3>
                    <p css={tw`text-sm text-neutral-400 flex items-center`}>
                        <span css={tw`mr-2`}>{modCategory}</span>
                        <FontAwesomeIcon icon={faDownload} css={tw`w-3 h-3 mr-1`} />
                        <span>{mod.downloads.toLocaleString()}</span>
                    </p>
                </div>
            </div>
            <div css={tw`text-sm mb-4 text-neutral-300 flex-grow`}>
                <p css={[tw`flex-grow`, expanded ? tw`` : tw`line-clamp-2`]}>{mod.description}</p>
                {mod.description.length > 100 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        css={tw`text-neutral-400 hover:text-neutral-300 mt-1 text-xs`}
                    >
                        {expanded ? 'Read less' : 'Read more'}
                    </button>
                )}
            </div>
            <div css={tw`flex justify-between items-center mt-auto`}>
                <div css={tw`flex items-center space-x-2`}>
                    <button
                        onClick={() => setExternalUrl(true)}
                        css={tw`bg-neutral-600 hover:bg-neutral-500 text-white p-2.5 rounded`}
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' css={tw`w-4 h-4 fill-current`}>
                            <path d='M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l82.7 0L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3l0 82.7c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160c0-17.7-14.3-32-32-32L320 0zM80 32C35.8 32 0 67.8 0 112L0 432c0 44.2 35.8 80 80 80l320 0c44.2 0 80-35.8 80-80l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16L80 448c-8.8 0-16-7.2-16-16l0-320c0-8.8 7.2-16 16-16l112 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 32z' />
                        </svg>
                    </button>
                </div>
                <div css={tw`flex items-center space-x-2`}>
                    <button
                        css={tw`bg-neutral-600 hover:bg-neutral-500 text-white px-4 py-2 rounded text-sm flex items-center`}
                        onClick={() => setModalVisible(true)}
                    >
                        <FontAwesomeIcon icon={faList} css={tw`mr-2`} />
                        Versions
                    </button>
                    {mod.installable ? (
                        <button
                            css={tw`bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded text-sm flex items-center`}
                            onClick={() => handleinstallMod(mod.category, mod.id, mod.name)}
                        >
                            <FontAwesomeIcon icon={faDownload} css={tw`mr-2`} />
                            Install
                        </button>
                    ) : (
                        <button
                            onClick={() => setExternalDownload(true)}
                            css={tw`bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded text-sm flex items-center`}
                        >
                            <FontAwesomeIcon icon={faCloudDownloadAlt} css={tw`mr-2`} />
                            Install
                        </button>
                    )}
                </div>
            </div>
            <Dialog.Confirm
                open={externalUrl}
                onClose={() => setExternalUrl(false)}
                title={`Redirect To Mod's Website`}
                confirm={'Open'}
                onConfirmed={() => {
                    window.open(mod.modUrl!);
                    setExternalUrl(false);
                }}
            >
                Click &apos;Open&apos; to visit mod&apos;s official website in a new tab.
            </Dialog.Confirm>
            <Dialog.Confirm
                open={externalDownload}
                onClose={() => setExternalDownload(false)}
                title={`Download Mod`}
                confirm={'Open'}
                onConfirmed={() => {
                    window.open(mod.modUrl!);
                    setExternalDownload(false);
                }}
            >
                This mod is only available for download on its official website. Click &apos;Open&apos; to continue.
            </Dialog.Confirm>
            <Modal visible={modalVisible} dismissable onDismissed={() => setModalVisible(false)} css={tw`mb-4`}>
                <h1 css={tw`w-full text-center text-2xl`}>List of Versions for &quot;{mod.name}&quot;</h1>
                <div css={tw`grid gap-4`}>
                    <ModsVersionContainer
                        category={mod.category}
                        modId={mod.id}
                        modName={mod.name}
                        modUrl={mod.modUrl}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ModsCard;
