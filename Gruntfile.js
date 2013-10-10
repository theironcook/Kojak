module.exports = function(grunt){

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        banner: '// <%= pkg.name %> Version <%= pkg.version %> \n' +
                '// Last built <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '// Distributed Under MIT License\n\n',

        // This file set is pretty small, I don't need anything fancy for dependencies like requireJS - especially if
        // it forces people to include yet another library just to use Kojak.
        // The order here is important. Don't change it.
        sourceFiles: [
            'src/Core.js',
            'src/Config.js',
            'src/Formatter.js',
            'src/FunctionProfile.js',
            'src/ContainerProfile.js',
            'src/Instrumentor.js',
            'src/Report.js',
            'src/Start.js'
        ],

        jasmine: {
            core: {
                src: 'src/Core.js',
                options: {
                    specs: 'spec/CoreSpec.js'
                }
            },
            config: {
                src: ['src/Core.js', 'src/Config.js'],
                options: {
                    specs: 'spec/ConfigSpec.js'
                }
            }
        },

        watch: {
            scripts: {
                files: ['<%= sourceFiles %>', 'spec/**Spec.js'],
                tasks: ['buildDev'],
                options: {
                    spawn: false
                }
            }
        },

        jshint: {
            beforeconcat: '<%= sourceFiles %>'
        },

        concat: {
            options: {
                stripBanners: true,
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= sourceFiles %>',
                dest: '<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            }
        },

        // Only useful to me in dev to work with main project - Remove at some point
        copy: {
            main: {
                src: 'Kojak.js',
                dest: 'C:/Projects/GryphonWork/gryphon-common/web-app/src/util/'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s). (also grunt watch)
    grunt.registerTask('buildDev', ['jshint', 'jasmine', 'concat', 'copy']);
    grunt.registerTask('buildProd', ['jshint', 'jasmine', 'concat', 'uglify']);

};