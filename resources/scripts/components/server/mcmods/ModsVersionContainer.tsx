import tw from 'twin.macro';
import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import { useStoreActions, Actions } from 'easy-peasy';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudDownloadAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Version, getModVersions, installModVersion } from '@/api/server/mcmods/getVersions';

interface ModsVersionContainerProps {
    category: string;
    modId: string | number;
    modName: string;
    modUrl: string;
}

const ModsVersionContainer: React.FC<ModsVersionContainerProps> = ({ category, modId, modName, modUrl }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const [externalUrl, setExternalUrl] = useState(false);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const fetchedVersions = await getModVersions(uuid, category, modId);
            setVersions(fetchedVersions);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, [uuid, category, modId]);

    const handleInstall = async (versionId: string | number, modName: string) => {
        try {
            clearFlashes('mcmods:install');
            await installModVersion(uuid, category, modId, versionId);
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
    if (loading) {
        return (
            <div css={tw`flex items-center justify-center h-full`}>
                <Spinner size='large' />
            </div>
        );
    }
    return (
        <div css={tw`p-4`}>
            {versions.length > 0 ? (
                <div css={tw`space-y-4`}>
                    {versions.map((version) => (
                        <GreyRowBox key={version.versionId} css={tw`justify-between flex flex-col md:flex-row`}>
                            <div css={tw`flex flex-col mb-2 md:mb-0`}>
                                <span css={tw`font-semibold text-lg`}>{version.versionName}</span>
                                {version.downloads && version.downloads > 0 && (
                                    <p css={tw`text-sm text-neutral-400 flex items-center`}>
                                        <FontAwesomeIcon icon={faDownload} css={tw`w-3 h-3 mr-1`} />
                                        <span>{version.downloads.toLocaleString()} downloads</span>
                                    </p>
                                )}
                            </div>
                            <div
                                css={tw`flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2`}
                            >
                                <div css={tw`flex space-x-2 items-center`}>
                                    <button
                                        onClick={() => setExternalUrl(true)}
                                        css={tw`bg-neutral-600 hover:bg-neutral-500 text-white p-2.5 rounded`}
                                    >
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            viewBox='0 0 512 512'
                                            css={tw`w-4 h-4 fill-current`}
                                        >
                                            <path d='M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l82.7 0L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3l0 82.7c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160c0-17.7-14.3-32-32-32L320 0zM80 32C35.8 32 0 67.8 0 112L0 432c0 44.2 35.8 80 80 80l320 0c44.2 0 80-35.8 80-80l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16L80 448c-8.8 0-16-7.2-16-16l0-320c0-8.8 7.2-16 16-16l112 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 32z' />
                                        </svg>
                                    </button>
                                    {version.downloadUrl ? (
                                        <a
                                            href={version.downloadUrl}
                                            css={tw`bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded text-sm flex items-center`}
                                        >
                                            <FontAwesomeIcon icon={faCloudDownloadAlt} css={tw`mr-2`} />
                                            Download
                                        </a>
                                    ) : (
                                        <button
                                            css={tw`bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded text-sm flex items-center`}
                                            onClick={() => handleInstall(version.versionId, modName)}
                                        >
                                            <FontAwesomeIcon icon={faDownload} css={tw`mr-2`} />
                                            Install
                                        </button>
                                    )}
                                </div>
                            </div>
                        </GreyRowBox>
                    ))}
                </div>
            ) : (
                <div css={tw`text-gray-600`}>No versions for this mod were found.</div>
            )}
            <Dialog.Confirm
                open={externalUrl}
                onClose={() => setExternalUrl(false)}
                title={`Redirect To Mod's Website`}
                confirm={'Open'}
                onConfirmed={() => {
                    window.open(modUrl!);
                    setExternalUrl(false);
                }}
            >
                Click &apos;Open&apos; to visit mod&apos;s official website in a new tab.
            </Dialog.Confirm>
        </div>
    );
};
export default ModsVersionContainer;
