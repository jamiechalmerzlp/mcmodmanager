import http from '@/api/http';

export interface Version {
    versionId: string | number;
    versionName: string;
    downloads?: number;
    downloadUrl?: string;
}

export const rawDataToVersion = (data: any): Version => {
    return {
        versionId: data.versionId,
        versionName: data.versionName,
        downloads: data.downloads,
        downloadUrl: data.downloadUrl,
    };
};

export const getModVersions = (uuid: string, category: string, modId: string | number): Promise<Version[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mcmods/version`, {
            params: {
                category,
                modId,
            },
        })
            .then((response) => {
                resolve(response.data.data.map((item: any) => rawDataToVersion(item)));
            })
            .catch(reject);
    });
};

export const installModVersion = (
    uuid: string,
    category: string,
    modId: string | number,
    versionId: string | number
): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/mcmods/install`, {
            category,
            modId,
            versionId,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
