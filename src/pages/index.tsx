import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { PrismicDocument } from '@prismicio/types';

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const formatPosts = (
  posts: PrismicDocument<Record<string, any>, string, string>[]
): Post[] => {
  return posts.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const fetchMorePosts = async (url: string): Promise<void> => {
    const response = await fetch(url);
    const data = await response.json();

    const formattedPosts = formatPosts(data.results);

    setPosts([...posts, ...formattedPosts]);
    setNextPage(data.next_page);
  };

  return (
    <>
      <Header />

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <h2>{post.data.subtitle}</h2>

                <div className={styles.infoContainer}>
                  <div className={styles.info}>
                    <FiCalendar />
                    <span>
                      {format(
                        new Date(post.first_publication_date),
                        'd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                  </div>

                  <div className={styles.info}>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
              type="button"
              className={styles.showMore}
              onClick={() => fetchMorePosts(nextPage)}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});

  const response = await prismic.getByType('posts', {
    pageSize: 10,
  });

  const { next_page } = response;

  const posts = formatPosts(response.results);

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page,
      },
    },
  };
};
