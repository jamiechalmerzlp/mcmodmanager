import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import { PaginationDataSet } from '@/api/http';
import React, { useState, useEffect } from 'react';
import Spinner from '@/components/elements/Spinner';
import { CSSTransition } from 'react-transition-group';
import Pagination from '@/components/elements/Pagination';
import SearchRow from '@/components/server/mcmods/SearchRow';
import FlashMessageRender from '@/components/FlashMessageRender';
import ModsCard from '@/components/server/mcmods/ModsCards';
import { Mod, getMods } from '@/api/server/mcmods/getMods';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [category, setCategory] = useState('modrinth');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [searchQuery, setSearchQuery] = useState('');
    const [type, setType] = useState('fabric');
    const [sortBy, setSortBy] = useState('downloads');
    const [minecraftVersion, setMinecraftVersion] = useState('');
    const [mods, setMods] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paginationData, setPaginationData] = useState<PaginationDataSet | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchMods = async () => {
            setLoading(true);
            setError(null);
            try {
                const { items, pagination } = await getMods(
                    uuid,
                    category,
                    page,
                    pageSize,
                    searchQuery,
                    type,
                    sortBy,
                    minecraftVersion
                );
                if (isMounted) {
                    setMods(items);
                    setPaginationData(pagination);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Error fetching mods');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchMods();
        return () => {
            isMounted = false;
        };
    }, [uuid, category, page, pageSize, searchQuery, type, sortBy, minecraftVersion]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, category]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setPage(1);
    };

    const handlePageSelect = (selectedPage: number) => {
        setPage(selectedPage);
    };

    return (
        <ServerContentBlock title={'Mod Manager'}>
            <SearchRow
                onSearch={handleSearch}
                minecraftVersion={minecraftVersion}
                setMinecraftVersion={setMinecraftVersion}
                category={category}
                setCategory={setCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                type={type}
                setType={setType}
                pageSize={pageSize}
                setPageSize={setPageSize}
            />
            <FlashMessageRender byKey={'mcmods:install'} css={tw`mt-6`} />
            {loading ? (
                <div css={tw`w-full flex justify-center mt-6`}>
                    <Spinner size='large' />
                </div>
            ) : error || mods.length === 0 ? (
                <div css={tw`mt-6`}>No Mods were found.</div>
            ) : (
                <CSSTransition classNames={'fade'} timeout={150} appear in>
                    <Pagination data={{ items: mods, pagination: paginationData! }} onPageSelect={handlePageSelect}>
                        {({ items }) => (
                            <div>
                                <div css={tw`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6`}>
                                    {items.map((mod) => (
                                        <ModsCard key={mod.id} mod={mod} />
                                    ))}
                                </div>
                                <div css={tw`w-full flex justify-center my-4 text-sm`}>
                                    {`Showing ${mods.length} out of ${paginationData?.total || 0} Mods`}
                                </div>
                            </div>
                        )}
                    </Pagination>
                </CSSTransition>
            )}
        </ServerContentBlock>
    );
};
